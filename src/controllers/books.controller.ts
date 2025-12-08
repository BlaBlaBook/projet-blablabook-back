import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";
import { parseIdFromParams } from "../lib/utils.ts";
import { ConflictError, NotFoundError } from "../lib/error.ts";
import { createBookSchema, updateBookSchema } from "../schemas/books.schema.ts";

export async function getAllBooks(req: Request, res: Response) {
  // On récupère l'ID de l'utilisateur connecté (via le middleware getUser)
  const userId = req.userId;

  // Fetch all books avec auteurs, genres et éventuellement le reading_status de l'utilisateur
  const books = await prisma.books.findMany({
    include: {
      authors: { include: { author: true } },
      genres: { include: { genre: true } },
      userRecords: userId ? { 
        where: { user_id: userId }, // filtre sur l'utilisateur connecté
        select: { reading_status: true } 
      } : false, // si pas connecté, ne récupère pas les records
    },
  });

  // Formatage des données
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
    reading_status: b.userRecords?.[0]?.reading_status ?? null, // null si pas connecté ou pas de record
    created_at: b.created_at,
    updated_at: b.updated_at,
  }));

  res.json(formattedBooks);
}


export async function getBookById(req: Request, res: Response) {
  const bookId = await parseIdFromParams(req.params.id);

  // Fetch the book by ID with authors and genres
  const book = await prisma.books.findUnique({
    where: { id: bookId },
    include: {
      authors: { include: { author: true } },
      genres: { include: { genre: true } },
    },
  });

  if (!book) throw new NotFoundError("Book not found");

  // Format the book object to hide pivot tables
  const formattedBook = {
    id: book.id,
    isbn: book.isbn,
    title: book.title,
    year: book.year,
    summary: book.summary,
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
    created_at: book.created_at,
    updated_at: book.updated_at,
  };

  res.json(formattedBook);
}

export async function createBook(req: Request, res: Response) {
  const data = await createBookSchema.parseAsync(req.body);

  await assertBooksIsbnUnique(data.isbn);

  const newBook = await prisma.books.create({
    data: {
      isbn: data.isbn,
      title: data.title,
      year: data.year,
      summary: data.summary,
      language: data.language,
      pages: data.pages,
      image_url: data.image_url,
      authors: {
        create: data.authors.map(a => ({
          author: a.id
            ? { connect: { id: a.id } } // link existing author
            : { create: { first_name: a.first_name!, last_name: a.last_name! } }, // create new author
        })),
      },
      genres: {
        create: data.genres.map(g => ({
          genre: g.id
            ? { connect: { id: g.id } } // link existing genre
            : { create: { category: g.category! } }, // create new genre
        })),
      },
    },
    include: {
      authors: { include: { author: true } },
      genres: { include: { genre: true } },
    },
  });

  // Format response to hide pivot tables
  const formattedBook = {
    ...newBook,
    authors: newBook.authors.map(ba => ({
      id: ba.author.id,
      first_name: ba.author.first_name,
      last_name: ba.author.last_name,
    })),
    genres: newBook.genres.map(bg => ({
      id: bg.genre.id,
      category: bg.genre.category,
    })),
  };

  res.status(201).json(formattedBook);
}

export async function updateBook(req: Request, res: Response) {
  const bookId = await parseIdFromParams(req.params.id);

  const existingBook = await prisma.books.findUnique({ where: { id: bookId } });
  if (!existingBook) throw new NotFoundError("Book not found");

  const updateData = await updateBookSchema.parseAsync(req.body);

  // Check ISBN uniqueness if provided and changed
  if (updateData.isbn && updateData.isbn !== existingBook.isbn) {
    await assertBooksIsbnUnique(updateData.isbn);
  }

  // Prepare update data
  const { authors, genres, ...bookFields } = updateData;

  // Use transaction to ensure consistency
  const updatedBook = await prisma.$transaction(async (tx) => {
    // 1. Update base book fields
    const book = await tx.books.update({
      where: { id: bookId },
      data: bookFields,
    });

    // 2. Handle authors if provided
    if (authors) {
      // Delete all existing relations
      await tx.book_author.deleteMany({
        where: { book_id: bookId },
      });

      // Separate existing and new authors
      const existingAuthors = authors.filter(a => a.id);
      const newAuthors = authors.filter(a => !a.id);

      // Create relations with existing authors
      if (existingAuthors.length > 0) {
        await tx.book_author.createMany({
          data: existingAuthors.map((a) => ({
            book_id: bookId,
            author_id: a.id!,
          })),
        });
      }

      // Create new authors and their relations
      for (const author of newAuthors) {
        const newAuthor = await tx.authors.create({
          data: {
            first_name: author.first_name!,
            last_name: author.last_name!,
          },
        });

        await tx.book_author.create({
          data: {
            book_id: bookId,
            author_id: newAuthor.id,
          },
        });
      }
    }

    // 3. Handle genres if provided
    if (genres) {
      // Delete all existing relations
      await tx.book_genre.deleteMany({
        where: { book_id: bookId },
      });

      // Separate existing and new genres
      const existingGenres = genres.filter(g => g.id);
      const newGenres = genres.filter(g => !g.id);

      // Create relations with existing genres
      if (existingGenres.length > 0) {
        await tx.book_genre.createMany({
          data: existingGenres.map((g) => ({
            book_id: bookId,
            genre_id: g.id!,
          })),
        });
      }

      // Create new genres and their relations
      for (const genre of newGenres) {
        const newGenre = await tx.genres.create({
          data: {
            category: genre.category!,
          },
        });

        await tx.book_genre.create({
          data: {
            book_id: bookId,
            genre_id: newGenre.id,
          },
        });
      }
    }

    // 4. Fetch complete book with all relations
    return await tx.books.findUnique({
      where: { id: bookId },
      include: {
        authors: { include: { author: true } },
        genres: { include: { genre: true } },
      },
    });
  });

  // Format response
  const formattedBook = {
    id: updatedBook!.id,
    isbn: updatedBook!.isbn,
    title: updatedBook!.title,
    year: updatedBook!.year,
    summary: updatedBook!.summary,
    language: updatedBook!.language,
    pages: updatedBook!.pages,
    image_url: updatedBook!.image_url,
    authors: updatedBook!.authors.map((ba) => ({
      id: ba.author.id,
      first_name: ba.author.first_name,
      last_name: ba.author.last_name,
    })),
    genres: updatedBook!.genres.map((bg) => ({
      id: bg.genre.id,
      category: bg.genre.category,
    })),
    created_at: updatedBook!.created_at,
    updated_at: updatedBook!.updated_at,
  };

  res.json(formattedBook);
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
