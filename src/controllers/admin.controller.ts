import { NotFoundError, ForbiddenError } from "../lib/error.ts";
import { getPrisma } from "../models/index.ts";
import type { Request, Response } from "express";

const prisma = getPrisma();

// -----------------------------------
// -------- GET /api/admin/users ------
// -----------------------------------
export async function getAllUsers(req: Request, res: Response) {
	// Fetch all users with selected fields
	const users = await prisma.users.findMany({
		select: {
			id: true,
			email: true,
			username: true,
			role: true,
			created_at: true,
			updated_at: true,
		},
	});

	// Return users list
	res.json({ users });
}

// -----------------------------------
// ----- DELETE /api/admin/users/:id ---
// -----------------------------------
export async function deleteUserById(req: Request, res: Response) {
	const userId = req.params.userId;

	// Check if user exists
	const existingUser = await prisma.users.findUnique({
		where: { id: userId },
	});

	if (!existingUser) {
		throw new NotFoundError("User not found");
	}

	// Prevent deletion of admin users
	if (existingUser.role === "admin") {
		throw new ForbiddenError("Admin user cannot be deleted");
	}

	// Delete the user
	await prisma.users.delete({
		where: { id: userId },
	});

	// Return 204 No Content on successful deletion
	res.status(204).send();
}
