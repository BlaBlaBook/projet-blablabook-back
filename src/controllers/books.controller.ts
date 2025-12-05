import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";
import { parseIdFromParams } from "../lib/utils.ts";
import { ConflictError, NotFoundError } from "../lib/error.ts";
import { createBookSchema, updateBookSchema } from "../schemas/books.schema.ts";

export async function getAllBooks(req: Request, res: Response) {
  const books = await prisma.books.findMany({
    include: {
      authors: {
        include: {
          author: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
    },
  });

  const formattedBooks = books.map((b) => ({
    id: b.id,
    isbn: b.isbn,
    title: b.title,
    year: b.year,
    summary: b.summary,
    language: b.language,
    pages: b.pages,
    image_url: b.image_url,
    authors: b.authors.map((ba) => ({
      id: ba.author.id,
      first_name: ba.author.first_name,
      last_name: ba.author.last_name,
    })),
    genres: b.genres.map((bg) => ({
      id: bg.genre.id,
      category: bg.genre.category,
    })),
    created_at: b.created_at,
    updated_at: b.updated_at,
  }));

  res.json(formattedBooks);
}


export async function getBookById(req: Request, res: Response) {
  const bookId = await parseIdFromParams(req.params.id);

  const book = await prisma.books.findUnique({ where: { id: bookId } });
  if (!book) throw new NotFoundError("Book not found");

  res.json(book);
}

export async function createBook(req: Request, res: Response) {
  const data = await createBookSchema.parseAsync(req.body);

  await assertBooksIsbnUnique(data.isbn);

  const newBook = await prisma.books.create({ data });
  res.status(201).json(newBook);
}

export async function updateBook(req: Request, res: Response) {
  const bookId = await parseIdFromParams(req.params.id);

  const existingBook = await prisma.books.findUnique({ where: { id: bookId } });
  if (!existingBook) throw new NotFoundError("Book not found");

  const updateData = await updateBookSchema.parseAsync(req.body);

  if (updateData.isbn) await assertBooksIsbnUnique(updateData.isbn);

  const updatedBook = await prisma.books.update({
    where: { id: bookId },
    data: updateData,
  });

  res.json(updatedBook);
}

export async function deleteBook(req: Request, res: Response) {
  const bookId = await parseIdFromParams(req.params.id);

  const existingBook = await prisma.books.findUnique({ where: { id: bookId } });
  if (!existingBook) throw new NotFoundError("Book not found");

  await prisma.books.delete({ where: { id: bookId } });
  res.status(204).send();
}

// Utility to ensure ISBN is unique
async function assertBooksIsbnUnique(isbn: string) {
  const existingBook = await prisma.books.findUnique({ where: { isbn } });
  if (existingBook) throw new ConflictError("A book with this ISBN already exists");
}
