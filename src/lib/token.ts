import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import type { JwtPayload } from "jsonwebtoken";
import type { Request, Response } from "express";
import { config } from "../../config.ts";
import { getPrisma, type users } from "../models/index.ts";
import { UnauthorizedError } from "./error.ts";

const prisma = getPrisma();

export const ACCESS_TOKEN_DURATION_IN_MS = 1 * 60 * 60 * 1000; // 1h
export const REFRESH_TOKEN_DURATION_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7d

// ----------------------------
// -------- Decode JWT --------
// ----------------------------
export function decodeJWT(accessToken: string): JwtPayload {
  try {
    // Verify & decode
    const payload = jwt.verify(accessToken, config.jwtSecret) as JwtPayload;
    return payload;

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Provided access token is expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("Provided access token is malformed");
    }
    
    console.error(error);
    throw new UnauthorizedError("JWT unknown error");
  }
}

// ---------------------------------
// ----- Generate access token -----
// ---------------------------------
export function generateAccessToken(user: users) {
  // Create JWT
  const payload = { userId: user.id, userRole: user.role };
  const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: ACCESS_TOKEN_DURATION_IN_MS / 1000 }); 
  return accessToken;
}

export async function generateRefreshToken(user: users) {
  const refreshToken = crypto.randomBytes(64).toString("base64");
  
  // Store in DB
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } }); 
  await prisma.refreshToken.create({ data: {
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_DURATION_IN_MS)
  }});

  return refreshToken;
}

// -----------------------------------
// -- Extract access token from req --
// -----------------------------------
export function extractAccessTokenFromRequest(req: Request) {
  // From header
  const authorizationHeader = req.headers.authorization;
  if (typeof authorizationHeader === "string") {
    return authorizationHeader.substring("Bearer ".length); 
  }

  // From cookie
  const accessTokenCookie = req.cookies.accessToken;
  if (typeof accessTokenCookie === "string") {
    return accessTokenCookie;
  }

  // Not found
  throw new UnauthorizedError("Access token not provided in Authorization headers or Cookies");
}

// -------------------------------
// ---- Set tokens in cookies ----
// -------------------------------
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
		httpOnly: true,
		maxAge: REFRESH_TOKEN_DURATION_IN_MS, // 7 days
		sameSite: isProd ? "none" : "lax",
		secure: isProd,
	});
}

// ----------------------------
// ----- Create session -------
// ----------------------------
export async function createSession(
  res: Response,
  user: users,
) {
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  setTokensInCookies(res, accessToken, refreshToken);
}
