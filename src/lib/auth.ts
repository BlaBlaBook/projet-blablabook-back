import { z } from "zod";
import type { Request, Response } from "express";
import { getPrisma } from "../models/index.ts";
import { UnauthorizedError, ConflictError } from "./error.ts";
import { generateAccessToken, generateRefreshToken } from "./token.ts";
import { setTokensInCookies } from "./token.ts";

const prisma = getPrisma();

// --------------------------------------------------------------
// Generate new access and refresh tokens and set them in cookies
// --------------------------------------------------------------
export async function attemptRefresh(req: Request, res: Response) {
	// Extract refresh token
	const rawToken = req.body?.refreshToken || req.cookies?.refreshToken;

	// Throw an error if refresh token is missing
	if (!rawToken) {
		throw new UnauthorizedError("Refresh token not provided");
	}

	const token = await z.string().parseAsync(rawToken);

	// Look up stored refresh token
	const storedToken = await prisma.refreshToken.findFirst({
		where: { token },
		include: { user: true },
	});

	if (!storedToken) throw new UnauthorizedError("Invalid refresh token");
	if (storedToken.expiresAt < new Date()) {
		throw new UnauthorizedError("Expired refresh token");
	}

	// Generate new tokens
	const accessToken = generateAccessToken(storedToken.user);
	const newRefreshToken = await generateRefreshToken(storedToken.user);

	// Update cookies
	setTokensInCookies(res, accessToken, newRefreshToken);

	return { accessToken, user: storedToken.user };
}

// -------------------------------------------------------------
// Checks if email or username is already taken by another user.
// -------------------------------------------------------------
export async function checkUniqueUser(
	email?: string,
	username?: string,
	userId?: string,
) {
	const conditions = [];

	if (email)
		conditions.push(userId ? { email, id: { not: userId } } : { email });
	if (username)
		conditions.push(userId ? { username, id: { not: userId } } : { username });

	if (conditions.length === 0) return;

	const existingUser = await prisma.users.findFirst({
		where: { OR: conditions },
	});

	if (!existingUser) return;

	if (email && existingUser.email === email)
		throw new ConflictError("Email already taken");
	if (username && existingUser.username === username)
		throw new ConflictError("Username already taken");
}
