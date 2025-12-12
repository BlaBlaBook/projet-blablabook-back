import type { Request, Response } from "express";
import { prisma, reading_status } from "../models/index.ts";
import { parseIdFromParams } from "../lib/utils.ts";
import { NotFoundError, ConflictError } from "../lib/error.ts";
import { changeReadingStatusSchema } from "../schemas/userLibrary.schema.ts";

export async function getUserLibraryBooks(req: Request, res: Response) {
  // userId garanti par isAuth
  const userId = req.userId!;

  // récupérer tous les enregistrements de livres de l'utilisateur
  const userBookRecords = await prisma.user_book_records.findMany({
    where: { user_id: userId },
    include: {
      book: {
        include: {
          authors: { include: { author: true } },
          genres: { include: { genre: true } },
        },
      },
    },
  });

  // formater les données pour le front
  const formattedBooks = userBookRecords.map((record) => {
    const book = record.book;

    return {
      id: book.id,
      isbn: book.isbn,
      title: book.title,
      year: book.year,
      language: book.language,
      pages: book.pages,
      image_url: book.image_url,

      authors: book.authors.map((ba) => ({
        id: ba.author.id,
        first_name: ba.author.first_name,
        last_name: ba.author.last_name,
      })),

      genres: book.genres.map((bg) => ({
        id: bg.genre.id,
        category: bg.genre.category,
      })),

      reading_status: record.reading_status,
      created_at: book.created_at,
      updated_at: book.updated_at,
    };
  });

  res.json(formattedBooks);
}

export async function getUserLibraryBookById(req: Request, res: Response) {
  const userId = req.userId!; // garanti par isAuth
  const bookId = await parseIdFromParams(req.params.bookId);

  // chercher l'enregistrement du livre pour cet utilisateur
  const record = await prisma.user_book_records.findFirst({
    where: { user_id: userId, book_id: bookId },
    include: {
      book: {
        include: {
          authors: { include: { author: true } },
          genres: { include: { genre: true } },
        },
      },
    },
  });

  if (!record) throw new NotFoundError("Book not found in user's library");

  const book = record.book;

  const formattedBook = {
    id: book.id,
    isbn: book.isbn,
    title: book.title,
    year: book.year,
    language: book.language,
    pages: book.pages,
    image_url: book.image_url,
    authors: book.authors.map((ba) => ({
      id: ba.author.id,
      first_name: ba.author.first_name,
      last_name: ba.author.last_name,
    })),
    genres: book.genres.map((bg) => ({
      id: bg.genre.id,
      category: bg.genre.category,
    })),
    reading_status: record.reading_status,
    created_at: book.created_at,
    updated_at: book.updated_at,
  };

  res.json(formattedBook);
}


export async function addBookToUserLibrary(req: Request, res: Response) {
  const userId = req.userId!;

  // extraire et valider l'ID du livre depuis les params
  const bookId = await parseIdFromParams(req.params.bookId);

  // vérifier que le livre existe
  const book = await prisma.books.findUnique({ where: { id: bookId } });
  if (!book) throw new NotFoundError("Book not found");

  // vérifier que le livre n'est pas déjà dans la bibliothèque
  const alreadyExists = await prisma.user_book_records.findFirst({
    where: { user_id: userId, book_id: bookId },
  });
  if (alreadyExists) throw new ConflictError("Book already in user's library");

  // créer l'enregistrement dans user_book_records
  const record = await prisma.user_book_records.create({
    data: {
      user: { connect: { id: userId } },
      book: { connect: { id: bookId } },
      reading_status: "à_lire" as reading_status, // ✅ Cast avec le type importé
    },
  });

  // retourner la réponse
  res.status(201).json({
    message: "Book added to library",
    record,
  });
}

// Mapping front -> Prisma
const frontToPrismaStatusMap = {
  "à lire": "à_lire",
  "en cours": "en_cours",
  "lu": "lu",
} as const;

export async function changeStatusOfBook(req: Request, res: Response) {
  const userId = req.userId!;
  const bookId = await parseIdFromParams(req.params.bookId);
  const { reading_status: frontStatus } = await changeReadingStatusSchema.parseAsync(req.body);

  const record = await prisma.user_book_records.findFirst({
    where: { user_id: userId, book_id: bookId },
  });
  if (!record) throw new NotFoundError("Book not found in user's library");

  // Mapper la valeur front en valeur Prisma
  const prismaStatus = frontToPrismaStatusMap[frontStatus as keyof typeof frontToPrismaStatusMap];

  // Mettre à jour avec le statut mappé
  const updatedRecord = await prisma.user_book_records.update({
    where: { id: record.id },
    data: { reading_status: prismaStatus as reading_status }, // ✅ Cast avec le type importé
  });

  res.json({
    message: "Reading status updated",
    record: updatedRecord,
  });
}

export async function removeBookFromUserLibrary(req: Request, res: Response) {
  const userId = req.userId!;
  
  // extraire et valider l'ID du livre depuis les params
  const bookId = await parseIdFromParams(req.params.bookId);

  // vérifier que le livre est dans la bibliothèque de l'utilisateur
  const record = await prisma.user_book_records.findFirst({
    where: { user_id: userId, book_id: bookId },
  });
  if (!record) throw new NotFoundError("Book not found in user's library");

  // supprimer l'enregistrement
  await prisma.user_book_records.delete({
    where: { id: record.id },
  });

  res.status(200).json({
    message: "Book removed from library",
  });
}

export async function updateBookRating(req: Request, res: Response) {
  const userId = req.userId!;
  const bookId = req.params.bookId;
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "La note doit être entre 1 et 5" });
  }

  const record = await prisma.user_book_records.findFirst({
    where: { user_id: userId, book_id: bookId },
  });

  if (!record) {
    return res.status(404).json({ error: "Livre non trouvé dans votre bibliothèque" });
  }

  const updatedRecord = await prisma.user_book_records.update({
    where: { id: record.id },
    data: { rating },
  });

  res.json({ message: "Note mise à jour", record: updatedRecord });
}
