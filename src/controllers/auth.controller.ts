import argon2 from "argon2";
import z from "zod";
import { prisma } from "../models/index.ts";
import type { Request, Response } from "express";
import { passwordValidationSchema } from "../lib/utils.ts";
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from "../lib/error.ts";
import { ACCESS_TOKEN_DURATION_IN_MS, generateAccessToken, generateRefreshToken, REFRESH_TOKEN_DURATION_IN_MS } from "../lib/token.ts";

export async function registerUser(req: Request, res: Response) {
  // Validate request body
  const registerUserBodySchema = z.object({
    username: z.string().min(1),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.email(),
    password: passwordValidationSchema
  });
  
  const { username, first_name, last_name, email, password } = await registerUserBodySchema.parseAsync(req.body);

  // Check if email already exists
  const alreadyExistingUser = await prisma.users.findFirst({ where: { email } });
  if (alreadyExistingUser) { throw new ConflictError("Email already taken"); }

  const hashedPassword = await argon2.hash(password);

  // Save the user in the DB
  const createdUser = await prisma.users.create({ data: {
    username,
    first_name,
    last_name,
    email,
    password: hashedPassword
  } });

  // Respond with status 201 + created user (without the password)
  res.status(201).json({
    id: createdUser.id,
    username: createdUser.username,
    first_name: createdUser.first_name,
    last_name: createdUser.last_name,
    email: createdUser.email,
    created_at: createdUser.created_at,
    updated_at: createdUser.updated_at
  });
}

export async function loginUser(req: Request, res: Response) {
  // Validate credentials
  const loginBodySchema = z.object({
    email: z.email(),
    password: z.string()
  });

  const { email, password } = await loginBodySchema.parseAsync(req.body);

  // Find user from the DB
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) { throw new BadRequestError("Email and password do not match"); }

  // Verify password
  const isMatching = await argon2.verify(user.password, password);
  if (!isMatching) { throw new BadRequestError("Email and password do not match"); }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  // Send tokens via cookies
  setTokensInCookies(res, accessToken, refreshToken);
}

export async function refreshAccessToken(req: Request, res: Response) {
  // Read refresh token from body or cookies
  const rawToken = req.body.refreshToken || req.cookies.refreshToken;
  const token = await z.string().parseAsync(rawToken);

  // Look up token
  const storedToken = await prisma.refreshToken.findFirst({ where: { token }, include: { user: true } });

  if (!storedToken) { throw new UnauthorizedError("Invalid refresh token"); }

  // Check expiration
  if (storedToken.expiresAt < new Date()) { throw new UnauthorizedError("Expired refresh token"); }

  // Generate new tokens
  const accessToken = generateAccessToken(storedToken.user);
  const newRefreshToken = await generateRefreshToken(storedToken.user);

  setTokensInCookies(res, accessToken, newRefreshToken);
}

export async function getCurrentUser(req: Request, res: Response) {
  // User ID injected by allowRoles middleware
  const userId = req.userId;

  // Fetch current authenticated user
  const user = await prisma.users.findUnique({
    where: { id: userId },
    omit: { password: true }
  });
  
  if (!user) {
    throw new NotFoundError("No user associated with this access token");
  }

  res.json(user);
}

export async function logoutUser(req: Request, res: Response) {
  // Clear auth cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(204).end();
}

function setTokensInCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    maxAge: ACCESS_TOKEN_DURATION_IN_MS, // 1 hour
  });
  res.cookie("refreshToken", refreshToken, {
    path: "/api/auth/refresh",
    httpOnly: true,
    maxAge: REFRESH_TOKEN_DURATION_IN_MS // 7 days
  });
}