import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";
import { parseIdFromParams } from "../lib/utils.ts";
import z from "zod";
import { ConflictError, NotFoundError } from "../lib/error.ts";

/**
 * Retrieves all books from the database.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} Sends a JSON array of all books.
 */
export async function getAllBooks(req: Request, res: Response) {
  const books = await prisma.books.findMany();
  res.json(books);
}

/**
 * Retrieves a single book by its ID.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @throws {NotFoundError} If no book is found with the given ID.
 * @returns {Promise<void>} Sends the book as JSON.
 */
export async function getBookById(req: Request, res: Response) {
  const bookId = await parseIdFromParams(req.params.id);
  const book = await prisma.books.findUnique({
    where: { id: bookId },
  });

  if (! book) {
    throw new NotFoundError("Book not found");
  }
  res.json(book);
}

/**
 * Creates a new book in the database.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @throws {ConflictError} If a book with the same ISBN already exists.
 * @returns {Promise<void>} Sends the newly created book as JSON with status 201.
 */
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

/**
 * Updates an existing book by its ID.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @throws {NotFoundError} If no book is found with the given ID.
 * @throws {ConflictError} If the updated ISBN already exists for another book.
 * @returns {Promise<void>} Sends the updated book as JSON.
 */
export async function updateBook(req: Request, res: Response){
  const bookId = await parseIdFromParams(req.params.id);
  const book = await prisma.books.findUnique({
    where: { id: bookId },
  });
  if (! book) {
    throw new NotFoundError("Book not found");
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

/**
 * Deletes a book by its ID.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @throws {NotFoundError} If no book is found with the given ID.
 * @returns {Promise<void>} Sends status 204 with no content.
 */
export async function deleteBook(req: Request, res: Response) {
  const bookId = await parseIdFromParams(req.params.id);
  const book = await prisma.books.findUnique({
    where: { id: bookId },
  });
  if (! book) {
    throw new NotFoundError("Book not found");
  }

  await prisma.books.delete({
    where: { id: bookId },
  });
  res.status(204).send();
}

/**
 * Ensures that a book ISBN is unique before creation or update.
 *
 * @param {string} isbn - The ISBN to check.
 * @throws {ConflictError} If a book with the given ISBN already exists.
 * @returns {Promise<void>}
 */
async function assertBooksIsbnUnique(isbn: string) {
  const existingBook = await prisma.books.findUnique({
    where: { isbn },
  });
  if (existingBook) {
    throw new ConflictError("A book with this ISBN already exists");
  }
}