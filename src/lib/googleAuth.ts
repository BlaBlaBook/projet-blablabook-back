import type { TokenPayload } from "google-auth-library";
import z from "zod";
import { getPrisma } from "../models/index.ts";
import { googleClient, googleCLientID } from "./googleClient.ts";
import { createSession } from "./token.ts";
import type { Response } from "express";

const prisma = getPrisma();

// Validate request body
export const googleCodeSchema = z.object({
	code: z.string().min(1),
});

// ------------------------------------
// Find existing user by Google email 
// or create one with a unique username
// ------------------------------------
export async function findOrCreateGoogleUser(payload: TokenPayload) {
	// Email is required to identify the user
	if (!payload.email) {
		throw new Error("Google payload missing email");
	}

	const email = payload.email;

	// Build a base username from Google name or email
	const baseUsername =
		payload.name?.replace(/\s+/g, "").toLowerCase() ?? email.split("@")[0];

	// Return user if already registered
	const user = await prisma.users.findUnique({ where: { email } });
	if (user) return user;

	// Ensure username uniqueness by appending a counter if needed
	let username = baseUsername;
	let counter = 1;

	while (await prisma.users.findUnique({ where: { username } })) {
		username = `${baseUsername}${counter++}`;
	}

	// Create Google-authenticated user (no password)
	return prisma.users.create({
		data: {
			email,
			username,
			password: null,
		},
	});
}

// -----------------------------
// Login user using Google OAuth
// -----------------------------
export async function loginWithGoogle(code: string, res: Response) {
	const { tokens } = await googleClient.getToken({
		code,
		redirect_uri: `${process.env.FRONTEND_URL}/auth/google/callback`,
	});

	if (!tokens.id_token) {
		throw new Error("Google did not return an ID token");
	}

	const ticket = await googleClient.verifyIdToken({
		idToken: tokens.id_token,
		audience: googleCLientID,
	});

	const payload = ticket.getPayload();
	if (!payload) {
		throw new Error("Google token payload is missing");
	}

	const user = await findOrCreateGoogleUser(payload);

	await createSession(res, user);
}
