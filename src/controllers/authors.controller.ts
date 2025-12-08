import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";
import { parseIdFromParams } from "../lib/utils.ts";
import { NotFoundError } from "../lib/error.ts";

export async function getAllAuthors(req: Request, res: Response) {
  const books = await prisma.authors.findMany();
  res.json(books);
}

export async function deleteAuthor(req: Request, res: Response) {
const authorId = await parseIdFromParams(req.params.id);

const existingAuthor = await prisma.authors.findUnique({
  where: { id: authorId },
});

if (!existingAuthor) throw new NotFoundError("Author not found");

await prisma.authors.delete({
  where: { id: authorId },
});

res.status(204).send();
}