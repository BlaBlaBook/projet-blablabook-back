import argon2 from "argon2";
import z from "zod";
import { prisma } from "../models/index.ts";
import type { Request, Response } from "express";
import { passwordValidationSchema } from "../lib/utils.ts";
import {
	BadRequestError,
	ConflictError,
	NotFoundError,
	ForbiddenError,
} from "../lib/error.ts";
import {
	generateAccessToken,
	generateRefreshToken,
	setTokensInCookies,
} from "../lib/token.ts";
import { generateDiceBearAvatar, generateRandomAvatarSeed } from "../lib/dicebear.ts";

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
// -------- GET /api/auth/me --------
// ----------------------------------
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

	// If user doesn't have an avatar_url, generate one based on their username or custom seed
	if (!user.avatar_url) {
		const avatarSeed = user.avatar_seed || user.username;
		const generatedAvatarSvg = generateDiceBearAvatar(avatarSeed);
		// Update the user with the generated avatar
		const updatedUser = await prisma.users.update({
			where: { id: userId },
			data: { avatar_url: generatedAvatarSvg },
			omit: { password: true },
		});
		res.json(updatedUser);
	} else {
		res.json(user);
	}
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

    // Check email uniqueness
    if (email) {
        const existingUser = await prisma.users.findFirst({
            where: { email, id: { not: userId } },
        });
        if (existingUser) throw new ConflictError("Email already taken");
    }

    // Get user
    const user = await prisma.users.findUnique({
        where: { id: userId },
    });

    if (!user) throw new NotFoundError("Current user not found");

    let hashedPassword: string | undefined;

    // Password update logic
    if (currentPassword || newPassword || confirmPassword) {
        // Must provide all fields
        if (!currentPassword || !newPassword || !confirmPassword) {
            throw new BadRequestError("Please fill current, new, and confirm password");
        }

        // Check current password
        const match = await argon2.verify(user.password, currentPassword);
        if (!match) {
            throw new ForbiddenError("Current password is incorrect");
        }

        // Check confirm
        if (newPassword !== confirmPassword) {
            throw new BadRequestError("New password and confirm password do not match");
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
};

// ----------------------------------
// ----- POST /api/auth/avatar ------
// ----------------------------------
export async function regenerateAvatar(req: Request, res: Response) {
	console.log('🎨 Regenerate avatar endpoint called');
	const userId = req.userId;
	
	try {
		console.log('Generating new avatar for user:', userId);
		// Générer un nouveau seed aléatoire
		const newSeed = generateRandomAvatarSeed();
		
		// Générer le nouvel avatar (utilise la collection par défaut)
		const newAvatar = generateDiceBearAvatar(newSeed);
		
		// Mettre à jour l'utilisateur
		const updatedUser = await prisma.users.update({
			where: { id: userId },
			data: {
				avatar_url: newAvatar,
				avatar_seed: newSeed
			},
			omit: { password: true }
		});
		
		res.json({
			message: "Avatar regenerated successfully",
			avatar_url: updatedUser.avatar_url
		});
		
	} catch (error) {
		console.error('Error regenerating avatar:', error);
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
