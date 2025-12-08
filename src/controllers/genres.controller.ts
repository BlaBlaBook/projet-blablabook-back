import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";
import { parseIdFromParams } from "../lib/utils.ts";
import { NotFoundError } from "../lib/error.ts";


export async function getAllGenres(req: Request, res: Response) {
  const genres = await prisma.genres.findMany();
  res.json(genres);
}

