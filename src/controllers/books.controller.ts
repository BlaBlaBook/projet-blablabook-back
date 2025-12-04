import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";
import { parseIdFromParams } from "./utils.ts";
import z from "zod";

export async function getAllBooks(req: Request, res: Response) {
  const books = await prisma.books.findMany();
  res.json(books);
}

export async function getBookById(req: Request, res: Response) {
  const bookId = await parseIdFromParams(req.params.id);
  const book = await prisma.books.findUnique({
    where: { id: bookId },
  });

  if (! book) {
    return res.status(404).json({ message: "Book not found" });
  }
  res.json(book);
}