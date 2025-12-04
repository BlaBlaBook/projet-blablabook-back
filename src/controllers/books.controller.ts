import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";

export async function getAllBooks(req: Request, res: Response) {
  const books = await prisma.books.findMany();
  res.json(books);
}