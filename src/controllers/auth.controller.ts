import z from "zod";
import { getPrisma } from "../models/index.ts";
import type { Request, Response } from "express";
import crypto from "node:crypto";
import sanitizeHtml from "sanitize-html";
import {
	passwordValidationSchema,
	registerSchema,
	loginSchema,
	updateUserSchema,
} from "../schemas/auth.schema.ts";
import {
	BadRequestError,
	NotFoundError,
	UnauthorizedError,
} from "../lib/error.ts";
import { createSession } from "../lib/token.ts";
import {
	generateDiceBearAvatar,
	generateRandomAvatarSeed,
	verifyAvatar,
} from "../lib/dicebear.ts";
import { checkUniqueUser } from "../lib/auth.ts";
import {
	validatePasswordChange,
	hashPassword,
	verifyPassword,
	generateResetToken,
} from "../lib/password.ts";
import { loginWithGoogle, googleCodeSchema } from "../lib/googleAuth.ts";
import { sendResetPasswordEmail } from "../lib/email.ts";

const prisma = getPrisma();

// -----------------------------------
// ----- POST /api/auth/register -----
// -----------------------------------
export async function registerUser(req: Request, res: Response) {
	const { username, email, password, confirmPassword } =
		await registerSchema.parseAsync(req.body);

	// Check if email or username already exists
	if (email || username) {
		await checkUniqueUser(email, username);
	}

	// Check if password and confirmPassword match
	if (password !== confirmPassword) {
		throw new BadRequestError("Password and confirm password do not match");
	}

	const hashedPassword = await hashPassword(password);

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
	const { email, password } = await loginSchema.parseAsync(req.body);

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
	await verifyPassword(user.password, password);

	// Generate tokens and send them via cookies
	await createSession(res, user);

	res.status(200).send();
}

// ----------------------------------
// --- POST /api/auth/google --------
// ----------------------------------
export async function googleAuth(req: Request, res: Response) {
	const { code } = await googleCodeSchema.parseAsync(req.body);

	// Use helper to handle Google login & session creation
	await loginWithGoogle(code, res);

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
			first_name: true,
			last_name: true,
			created_at: true,
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
	if (!user.avatar_url)
		finalUser = await verifyAvatar(user.id, user.username, user.avatar_seed);

	// Send user object without password + with hasPassword
	// biome-ignore lint/correctness/noUnusedVariables: deconstruct password to remove it only
	const { password, ...userWithoutPassword } = finalUser;
	res.json({ ...userWithoutPassword, hasPassword });
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

	const {
		username,
		email,
		first_name,
		last_name,
		avatar_url,
		currentPassword,
		newPassword,
		confirmPassword,
	} = await updateUserSchema.parseAsync(req.body);

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
		hashedPassword = await validatePasswordChange({
			userHasPassword: !!user.password,
			storedPassword: user.password,
			currentPassword,
			newPassword,
			confirmPassword,
		});
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
		const { token, tokenHash, expiresAt } = await generateResetToken();

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

		// Sanitize email and send mail
		const safeEmail = sanitizeHtml(email);
		await sendResetPasswordEmail(safeEmail, resetLink);

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

	const { token, password, confirmPassword } = await bodySchema.parseAsync(
		req.body,
	);

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

	const hashedPassword = await hashPassword(password);

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
