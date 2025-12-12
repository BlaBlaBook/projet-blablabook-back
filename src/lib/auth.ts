import { z } from "zod";
import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";
import { UnauthorizedError } from "./error.ts";
import { generateAccessToken, generateRefreshToken } from "./token.ts";
import { setTokensInCookies } from "./token.ts";

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
