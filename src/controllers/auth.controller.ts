import argon2 from "argon2";
import z from "zod";
import { prisma } from "../models/index.ts";
import type { Request, Response } from "express";
import crypto from "crypto";
import { Resend } from "resend";
import sanitizeHtml from "sanitize-html";
import { passwordValidationSchema } from "../lib/utils.ts";
import {
	BadRequestError,
	NotFoundError,
	ForbiddenError,
	UnauthorizedError,
} from "../lib/error.ts";
import {
	generateAccessToken,
	generateRefreshToken,
	setTokensInCookies,
} from "../lib/token.ts";
import {
	generateDiceBearAvatar,
	generateRandomAvatarSeed,
} from "../lib/dicebear.ts";
import { googleClient, googleCLientID } from "../lib/googleClient.ts";
import { checkUniqueUser } from "../lib/auth.ts";

// Get Resend config (API key, domain name)
const resendApiKey = process.env.RESEND_API_KEY;
const resendDomainName = process.env.RESEND_DOMAIN_NAME;

if (!resendApiKey) console.warn("⚠️ Resend API key not set in .env");
if (!resendDomainName) console.warn("⚠️ Resend domain name not set in .env");

const resend = new Resend(resendApiKey);

// -----------------------------------
// ----- POST /api/auth/register -----
// -----------------------------------
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

	// Check if email or username already exists
	if (email || username) {
		await checkUniqueUser(email, username);
	}

	// Check if password and confirmPassword match
	if (password !== confirmPassword) {
		throw new BadRequestError("Password and confirm password do not match");
	}

	const hashedPassword = await argon2.hash(password);

	// Generate DiceBear avatar SVG based on username (or custom seed if available)
	const avatarSeed = req.body.avatar_seed || username;
	const avatarSvg = generateDiceBearAvatar(avatarSeed);

	// Save the user in the DB
	const createdUser = await prisma.users.create({
		data: {
			username,
			email,
			password: hashedPassword,
			avatar_url: avatarSvg,
		},
	});

	// Respond with status 201 + created user (without the password)
	res.status(201).json({
		id: createdUser.id,
		username: createdUser.username,
		email: createdUser.email,
		avatar_url: createdUser.avatar_url,
		created_at: createdUser.created_at,
		updated_at: createdUser.updated_at,
	});
}

// ----------------------------------
// ------ POST /api/auth/login ------
// ----------------------------------
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

	// If user created the account with Google and didn't set a password afterward
	// Send an error if trying to login with credentials
	if (!user.password) {
		throw new BadRequestError(
			"Account created with Google OAuth, needs to add a password to use credentials login.",
		);
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

// ----------------------------------
// --- POST /api/auth/google --------
// ----------------------------------
export async function googleAuth(req: Request, res: Response) {
	// 1. Validate request body
	const bodySchema = z.object({
		code: z.string().min(1),
	});

	const { code } = await bodySchema.parseAsync(req.body);

	// 2. Exchange code for tokens
	const { tokens } = await googleClient.getToken({
		code,
		redirect_uri: `${process.env.FRONTEND_URL}/auth/google/callback`,
	});
	const idToken = tokens.id_token;

	if (!idToken) {
		throw new BadRequestError("Invalid Google authorization code");
	}

	// 3. Verify ID token
	const ticket = await googleClient.verifyIdToken({
		idToken,
		audience: googleCLientID,
	});

	const payload = ticket.getPayload();
	if (!payload?.email) {
		console.error("Google login failed: Invalid Google token payload", payload);
		throw new BadRequestError("Invalid Google token payload");
	}

	const email = payload.email;
	const baseUsername =
		payload.name?.replace(/\s+/g, "").toLowerCase() ?? email.split("@")[0];
	let username = baseUsername;

	// 4. Find or create user
	let user = await prisma.users.findUnique({ where: { email } });

	if (!user) {
		// Only append counter if base username already exists
		const existingUser = await prisma.users.findUnique({
			where: { username: baseUsername },
		});
		if (existingUser) {
			let counter = 1;
			while (
				await prisma.users.findUnique({
					where: { username: `${baseUsername}${counter}` },
				})
			) {
				counter++;
			}
			username = `${baseUsername}${counter}`;
		}

		user = await prisma.users.create({
			data: {
				email,
				username,
				password: null, // Google-authenticated users
			},
		});
	}

	// 5. Generate tokens (same as login)
	const accessToken = generateAccessToken(user);
	const refreshToken = await generateRefreshToken(user);

	// 6. Send cookies
	setTokensInCookies(res, accessToken, refreshToken);

	// 7. Done
	res.status(200).send();
}

// ----------------------------------
// -------- GET /api/auth/me --------
// ----------------------------------
export async function getCurrentUser(req: Request, res: Response) {
	const userId = req.userId;

	// Fetch current authenticated user
	const user = await prisma.users.findUnique({
		where: { id: userId },
		select: {
			id: true,
			email: true,
			username: true,
			created_at: true,
			updated_at: true,
			avatar_url: true,
			avatar_seed: true,
			role: true,
			password: true, // to check existence (accounts created with google have no password)
		},
	});

	if (!user) {
		throw new NotFoundError("No user associated with this access token");
	}

	// Determine if the user has a password
	const hasPassword = Boolean(user.password);

	// If user doesn't have an avatar_url, generate one
	let finalUser = user;

	if (!user.avatar_url) {
		const avatarSeed = user.avatar_seed || user.username;
		const generatedAvatarSvg = generateDiceBearAvatar(avatarSeed);

		finalUser = await prisma.users.update({
			where: { id: userId },
			data: {
				avatar_url: generatedAvatarSvg,
				avatar_seed: user.avatar_seed ?? avatarSeed,
			},
		});
	}

	// Send user object without password + with hasPassword
	res.json({
		...finalUser,
		hasPassword,
	});
}

// -----------------------------------
// ------ POST /api/auth/logout ------
// -----------------------------------
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

// ----------------------------------
// ------- PATCH /api/auth/me -------
// ----------------------------------
export async function updateCurrentUser(req: Request, res: Response) {
	const userId = req.userId;

	if (!userId) throw new UnauthorizedError("User id is missing");

	// Schema
	const updateUserBodySchema = z.object({
		username: z.string().min(1).optional(),
		email: z.email().optional(),
		last_name: z.string().optional(),
		first_name: z.string().optional(),
		avatar_url: z.url().optional(),
		currentPassword: passwordValidationSchema.optional(),
		newPassword: passwordValidationSchema.optional(),
		confirmPassword: passwordValidationSchema.optional(),
	});

	const {
		username,
		email,
		first_name,
		last_name,
		avatar_url,
		currentPassword,
		newPassword,
		confirmPassword,
	} = await updateUserBodySchema.parseAsync(req.body);

	// Check email and username uniqueness
	if (email || username) {
		await checkUniqueUser(email, username, userId);
	}

	// Get user
	const user = await prisma.users.findUnique({
		where: { id: userId },
	});

	if (!user) throw new NotFoundError("Current user not found");

	let hashedPassword: string | undefined;

	// Password update / creation logic
	if (newPassword && confirmPassword) {
		// If user has a password, currentPassword is required
		if (user.password) {
			if (!currentPassword)
				throw new BadRequestError("Current password is required");
			const match = await argon2.verify(user.password, currentPassword);
			if (!match) throw new ForbiddenError("Current password is incorrect");
		}

		// Confirm check
		if (newPassword !== confirmPassword) {
			throw new BadRequestError(
				"New password and confirm password do not match",
			);
		}

		// Hash new pwd
		hashedPassword = await argon2.hash(newPassword);
	}

	// Update
	const updatedUser = await prisma.users.update({
		where: { id: userId },
		data: {
			username,
			email,
			first_name,
			last_name,
			avatar_url,
			password: hashedPassword,
		},
		omit: { password: true },
	});

	return res.json(updatedUser);
}

// ----------------------------------
// ----- POST /api/auth/avatar ------
// ----------------------------------
export async function regenerateAvatar(req: Request, res: Response) {
	console.log("🎨 Regenerate avatar endpoint called");
	const userId = req.userId;

	try {
		console.log("Generating new avatar for user:", userId);
		// Générer un nouveau seed aléatoire
		const newSeed = generateRandomAvatarSeed();

		// Générer le nouvel avatar (utilise la collection par défaut)
		const newAvatar = generateDiceBearAvatar(newSeed);

		// Mettre à jour l'utilisateur
		const updatedUser = await prisma.users.update({
			where: { id: userId },
			data: {
				avatar_url: newAvatar,
				avatar_seed: newSeed,
			},
			omit: { password: true },
		});

		res.json({
			message: "Avatar regenerated successfully",
			avatar_url: updatedUser.avatar_url,
		});
	} catch (error) {
		console.error("Error regenerating avatar:", error);
		throw new Error("Failed to regenerate avatar");
	}
}

// -----------------------------------
// ------- DELETE /api/auth/me -------
// -----------------------------------
export async function deleteCurrentUser(req: Request, res: Response) {
	const userId = req.userId;
	await prisma.users.delete({ where: { id: userId } });

	// Clear auth cookies
	res.clearCookie("accessToken");
	res.clearCookie("refreshToken");

	res.status(200).json({ message: "User deleted" });
}

// -----------------------------------------------
// ----- POST /api/auth/forgot-password ----------
// -----------------------------------------------
export async function forgotPassword(req: Request, res: Response) {
	// Validate request body
	const bodySchema = z.object({
		email: z.email("Invalid email address"),
	});

	try {
		const { email } = await bodySchema.parseAsync(req.body);

		// Always return 204 to avoid email enumeration
		const user = await prisma.users.findUnique({
			where: { email },
		});

		if (!user) {
			return res.status(204).send();
		}

		// Generate secure reset token
		const token = crypto.randomBytes(32).toString("hex");
		const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

		// Token expiration (30 minutes)
		const expiresAt = new Date();
		expiresAt.setMinutes(expiresAt.getMinutes() + 30);

		await prisma.resetPasswordToken.deleteMany({
			where: { userId: user.id },
		});

		await prisma.resetPasswordToken.create({
			data: {
				tokenHash,
				expiresAt,
				userId: user.id,
			},
		});

		// Password reset link (local dev)
		const resetLink = `${process.env.FRONTEND_URL}/login/reset-password?token=${token}`;

		console.log("🔐 Password reset link (dev only)");
		console.log(resetLink);

		const safeEmail = sanitizeHtml(email);

		await resend.emails.send({
			from: `no-reply@${resendDomainName}`,
			to: safeEmail,
			subject: "Réinitialisation de votre mot de passe",
			html: `
				<h1>Réinitialisation du mot de passe</h1>
				<p>Vous avez demandé à réinitialiser votre mot de passe.</p>
				<p>Cliquez sur ce lien pour choisir un nouveau mot de passe :</p>
				<p><a href="${resetLink}">${resetLink}</a></p>
				<p>Ce lien expire dans 30 minutes.</p>
				<p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
			`,
		});

		return res.status(204).send();
	} catch (error) {
		// Always return 204 to avoid email enumeration
		console.error(error);
		return res.status(204).send();
	}
}

// -----------------------------------------------
// ----- POST /api/auth/reset-password -----------
// -----------------------------------------------
export async function resetPassword(req: Request, res: Response) {
	// Validate request body
	const bodySchema = z.object({
		token: z.string().min(1),
		password: passwordValidationSchema,
		confirmPassword: passwordValidationSchema,
	});

	const { token, password, confirmPassword } =
		await bodySchema.parseAsync(req.body);

	// Check if password and confirmPassword match
	if (password !== confirmPassword) {
		throw new BadRequestError("Password and confirm password do not match");
	}

	const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

	const resetTokenRow = await prisma.resetPasswordToken.findFirst({
		where: {
			tokenHash,
			expiresAt: {
				gt: new Date(),
			},
		},
	});

	if (!resetTokenRow) {
		throw new BadRequestError("Invalid or expired token");
	}

	const hashedPassword = await argon2.hash(password);

	await prisma.users.update({
		where: { id: resetTokenRow.userId },
		data: {
			password: hashedPassword,
		},
	});

	await prisma.resetPasswordToken.deleteMany({
		where: { userId: resetTokenRow.userId },
	});

	// Invalidate all refresh tokens after password reset
	await prisma.refreshToken.deleteMany({
		where: { userId: resetTokenRow.userId },
	});

	return res.status(204).send();
}
