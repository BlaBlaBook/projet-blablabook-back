import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";
import { parseIdFromParams } from "./utils.ts";
import z from "zod";
import { log } from "console";

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

export async function createBook(req: Request, res: Response) {
  const createBookSchema = z.object({
  isbn: z.string().min(13).max(17),
  title: z.string().min(1).max(255),
  year: z.number().int(),
  summary: z.string().min(1),
  language: z.string().length(2),
  pages: z.number().int().min(1),
  image_url: z.url().max(255),
});

const { isbn, title, year, summary, language, pages, image_url } = await createBookSchema.parseAsync(req.body);

await assertBooksIsbnUnique(isbn);

  const newBook = await prisma.books.create({
    data: {
      isbn,
      title,
      year,
      summary,
      language,
      pages,
      image_url,
    },
  });
  res.status(201).json(newBook);  
}

export async function updateBook(req: Request, res: Response){
  const bookId = await parseIdFromParams(req.params.id);
  const book = await prisma.books.findUnique({
    where: { id: bookId },
  });
  if (! book) {
    return res.status(404).json({ message: "Book not found" });
  }

  const updateBookSchema = z.object({
    isbn: z.string().min(13).max(17).optional(),
    title: z.string().min(1).max(255).optional(),
    year: z.number().int().optional(),
    summary: z.string().min(1).optional(),
    language: z.string().length(2).optional(),
    pages: z.number().int().min(1).optional(),
    image_url: z.url().max(255).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

  const updateData = await updateBookSchema.parseAsync(req.body);

  if (updateData.isbn) {
    await assertBooksIsbnUnique(updateData.isbn);
  }

  const updatedBook = await prisma.books.update({
    where: { id: bookId },
    data: updateData,
  });
  res.json(updatedBook);    
}

export async function deleteBook(req: Request, res: Response) {
  const bookId = await parseIdFromParams(req.params.id);
  const book = await prisma.books.findUnique({
    where: { id: bookId },
  });
  if (! book) {
    return res.status(404).json({ message: "Book not found" });
  }

  await prisma.books.delete({
    where: { id: bookId },
  });
  res.status(204).send();  
}

async function assertBooksIsbnUnique(isbn: string) {
  const existingBook = await prisma.books.findUnique({
    where: { isbn },
  });
  if (existingBook) {
    throw new Error("A book with this ISBN already exists");
  }
}