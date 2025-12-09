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
		email: z.email(),
		password: passwordValidationSchema,
		confirmPassword: passwordValidationSchema,
	});

	const { username, email, password, confirmPassword } =
		await registerUserBodySchema.parseAsync(req.body);

	// Check if email already exists
	const alreadyExistingUser = await prisma.users.findFirst({
		where: { email },
	});
	if (alreadyExistingUser) {
		throw new ConflictError("Email already taken");
	}

	// Check if password and confirmPassword match
	if (password !== confirmPassword) {
		throw new BadRequestError("Password and confirm password do not match");
	}

	const hashedPassword = await argon2.hash(password);

	// Save the user in the DB
	const createdUser = await prisma.users.create({
		data: {
			username,
			email,
			password: hashedPassword,
		},
	});

	// Respond with status 201 + created user (without the password)
	res.status(201).json({
		id: createdUser.id,
		username: createdUser.username,
		email: createdUser.email,
		created_at: createdUser.created_at,
		updated_at: createdUser.updated_at,
	});
}

export async function loginUser(req: Request, res: Response) {
	// Validate credentials
	const loginBodySchema = z.object({
		email: z.email(),
		password: z.string(),
	});

	const { email, password } = await loginBodySchema.parseAsync(req.body);

	// Find user from the DB
	const user = await prisma.users.findUnique({ where: { email } });
	if (!user) {
		throw new BadRequestError("Email and password do not match");
	}

	// Verify password
	const isMatching = await argon2.verify(user.password, password);
	if (!isMatching) {
		throw new BadRequestError("Email and password do not match");
	}

	// Generate tokens
	const accessToken = generateAccessToken(user);
	const refreshToken = await generateRefreshToken(user);

	// Send tokens via cookies
	setTokensInCookies(res, accessToken, refreshToken);

	res.status(200).send();
}

export async function refreshAccessToken(req: Request, res: Response) {
	// Read refresh token from body or cookies
	const rawToken = req.body.refreshToken || req.cookies.refreshToken;
	const token = await z.string().parseAsync(rawToken);

	// Look up token
	const storedToken = await prisma.refreshToken.findFirst({
		where: { token },
		include: { user: true },
	});

	if (!storedToken) {
		throw new UnauthorizedError("Invalid refresh token");
	}

	// Check expiration
	if (storedToken.expiresAt < new Date()) {
		throw new UnauthorizedError("Expired refresh token");
	}

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
		omit: { password: true },
	});

	if (!user) {
		throw new NotFoundError("No user associated with this access token");
	}

	res.json(user);
}

export async function logoutUser(req: Request, res: Response) {
	if (!req.userId) {
		return res.status(401).json({ message: "Unauthenticated user" });
	}
	// Clear auth cookies
	res.clearCookie("accessToken");
	res.clearCookie("refreshToken");
	await prisma.refreshToken.deleteMany({ where: { userId: req.userId } });

	res.status(204).send();
}

export async function updateCurrentUser(req: Request, res: Response) {
	const userId = req.userId;
	// Validate request body
	const updateUserBodySchema = z.object({
		username: z.string().min(1).optional(),
		email: z.email().optional(),
		last_name: z.string().optional(),
		first_name: z.string().optional(),
		password: passwordValidationSchema.optional(),
		confirmPassword: passwordValidationSchema.optional(),
	});
	const { username, email, first_name, last_name, password, confirmPassword } =
		await updateUserBodySchema.parseAsync(req.body);

	// If email is being updated, check if it's already taken
	if (email) {
		const existingUser = await prisma.users.findFirst({
			where: { email, id: { not: userId } },
		});
		if (existingUser) {
			throw new ConflictError("Email already taken");
		}
	}
	// If password is being updated, check if it matches confirmPassword
	let hashedPassword: string | undefined = undefined;
	if (password || confirmPassword) {
		if (password !== confirmPassword) {
			throw new BadRequestError("Password and confirm password do not match");
		}
		hashedPassword = await argon2.hash(password!);
	}

	// Update user in the DB
	const updatedUser = await prisma.users.update({
		where: { id: userId },
		data: {
			username,
			email,
			first_name,
			last_name,
			password: hashedPassword,
		},
		omit: { password: true },
	});
	res.json(updatedUser);
}

export async function deleteCurrentUser(req: Request, res: Response) {
	const userId = req.userId;
	await prisma.users.delete({ where: { id: userId } });
	res.status(204).send();
}

export function setTokensInCookies(
	res: Response,
	accessToken: string,
	refreshToken: string,
) {
	const isProd = process.env.NODE_ENV === "production";

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		maxAge: ACCESS_TOKEN_DURATION_IN_MS, // 1 hour
		sameSite: isProd ? "none" : "lax", // "none" in prod for cross-site requests
		secure: isProd, // true in prod, false locally
	});

	res.cookie("refreshToken", refreshToken, {
		path: "/api/auth/refresh",
		httpOnly: true,
		maxAge: REFRESH_TOKEN_DURATION_IN_MS, // 7 days
		sameSite: isProd ? "none" : "lax",
		secure: isProd,
	});
}
