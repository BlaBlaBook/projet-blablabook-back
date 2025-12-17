import type { Request, Response } from "express";
import { getPrisma } from "../models/index.ts";
import { parseIdFromParams } from "../lib/utils.ts";
import { NotFoundError } from "../lib/error.ts";

const prisma = getPrisma();

// -----------------------------------
// -------- GET /api/authors ---------
// -----------------------------------
export async function getAllAuthors(req: Request, res: Response) {
	// Fetch all authors from database
	const authors = await prisma.authors.findMany();

	// Return authors list
	res.json(authors);
}

// -----------------------------------
// ----- DELETE /api/authors/:id ------
// -----------------------------------
export async function deleteAuthor(req: Request, res: Response) {
	// Parse and validate author ID from URL params
	const authorId = await parseIdFromParams(req.params.id);

	// Check if author exists
	const existingAuthor = await prisma.authors.findUnique({
		where: { id: authorId },
	});

	if (!existingAuthor) {
		throw new NotFoundError("Author not found");
	}

	// Delete the author
	await prisma.authors.delete({
		where: { id: authorId },
	});

	// Return 204 No Content on successful deletion
	res.status(204).send();
}