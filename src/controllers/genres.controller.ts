import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";
import { parseIdFromParams } from "../lib/utils.ts";
import { NotFoundError } from "../lib/error.ts";


export async function getAllGenres(req: Request, res: Response) {
  const genres = await prisma.genres.findMany();
  res.json(genres);
}

export async function deleteGenre(req: Request, res: Response) {
  const genreId = await parseIdFromParams(req.params.id);

  const existingGenre = await prisma.genres.findUnique({
    where: { id: genreId },
  });

  if (!existingGenre) throw new NotFoundError("Genre not found");

  await prisma.genres.delete({
    where: { id: genreId },
  });

  res.status(204).send();
}