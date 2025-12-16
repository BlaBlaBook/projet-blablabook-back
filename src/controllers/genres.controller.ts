import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";
import { parseIdFromParams } from "../lib/utils.ts";
import { NotFoundError } from "../lib/error.ts";


// -----------------------------------
// -------- GET /api/genres ---------
// -----------------------------------
export async function getAllGenres(req: Request, res: Response) {
	// Fetch all genres from database
	const genres = await prisma.genres.findMany();

	// Return genres list
	res.json(genres);
}

// -----------------------------------
// ----- DELETE /api/genres/:id ------
// -----------------------------------
export async function deleteGenre(req: Request, res: Response) {
	// Parse and validate genre ID from URL params
	const genreId = await parseIdFromParams(req.params.id);

	// Check if genre exists
	const existingGenre = await prisma.genres.findUnique({
		where: { id: genreId },
	});

	if (!existingGenre) {
		throw new NotFoundError("Genre not found");
	}

	// Delete the genre
	await prisma.genres.delete({
		where: { id: genreId },
	});

	// Return 204 No Content on successful deletion
	res.status(204).send();
}