import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";
import type { booksWhereInput } from "../../generated/prisma/models.ts";
import { parseIdFromParams } from "../lib/utils.ts";
import { ConflictError, NotFoundError } from "../lib/error.ts";
import { createBookSchema, updateBookSchema } from "../schemas/books.schema.ts";

// ----------------------------
// ------ GET /api/books ------
// ----------------------------
export async function getAllBooks(req: Request, res: Response) {
	const userId = req.userId;

	// Pagination / offset
	const limit = req.query.limit ? Number(req.query.limit) : 20;
	const offset = req.query.offset ? Number(req.query.offset) : 0;

	// Filters sent from frontend
	const authorId =
		typeof req.query.authorId === "string" ? req.query.authorId : undefined;
	const genreId =
		typeof req.query.genreId === "string" ? req.query.genreId : undefined;

	// Years range
	const yearMin = req.query.yearMin ? Number(req.query.yearMin) : undefined;
	const yearMax = req.query.yearMax ? Number(req.query.yearMax) : undefined;

	// Search bar (title)
	const search = req.query.search as string | undefined;

	const where: booksWhereInput = {};

	// Filter by author Id
	if (authorId) {
		where.authors = {
			some: { author_id: authorId },
		};
	}

	// Filter by genre Id
	if (genreId) {
		where.genres = {
			some: { genre_id: genreId },
		};
	}

	// Years min/max
	if (yearMin || yearMax) {
		where.year = {};

		if (yearMin) where.year.gte = yearMin;
		if (yearMax) where.year.lte = yearMax;
	}

	// Search by title
	if (search) {
		where.title = {
			contains: search,
			mode: "insensitive",
		};
	}

  // Prisma query
	const books = await prisma.books.findMany({
		where,
		skip: offset,
		take: limit,
		include: {
			authors: { include: { author: true } },
			genres: { include: { genre: true } },
			userRecords: userId
				? {
						where: { user_id: userId },
						select: { reading_status: true },
					}
				: false,
		},
	});

  // Total count of books returned
	const total = await prisma.books.count({ where });

  // Build res for client
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
		reading_status: b.userRecords?.[0]?.reading_status ?? null,
		created_at: b.created_at,
		updated_at: b.updated_at,
	}));

  // Send res
	res.json({
		total,
		limit,
		offset,
		count: formattedBooks.length,
		data: formattedBooks,
	});
}


// --------------------------------
// ------ GET /api/books/:id ------
// --------------------------------
export async function getBookById(req: Request, res: Response) {
	const bookId = await parseIdFromParams(req.params.id);
	const userId = req.userId;

	// Fetch the book by ID with authors, genres, and optionally user's reading_status
	const book = await prisma.books.findUnique({
		where: { id: bookId },
		include: {
			authors: { include: { author: true } },
			genres: { include: { genre: true } },
			userRecords: userId
				? {
						where: { user_id: userId },
						select: { reading_status: true },
					}
				: false,
		},
	});

	if (!book) throw new NotFoundError("Book not found");

	// Format the book object
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
		reading_status: book.userRecords?.[0]?.reading_status ?? null,
		created_at: book.created_at,
		updated_at: book.updated_at,
	};

	res.json(formattedBook);
}


// -----------------------------
// ------ POST /api/books ------
// -----------------------------
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
          ? { connect: { id: a.id } }
          : { create: { first_name: a.first_name!, last_name: a.last_name! } },
      })),
    },
    genres: {
      create: data.genres.map(g => ({
        genre: g.id
          ? { connect: { id: g.id } }
          : { 
              connectOrCreate: {
                where: { category: g.category! },
                create: { category: g.category! }
              }
            },
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


// ----------------------------
// --- PATCH /api/books/:id ---
// ----------------------------
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

      // Create new genres and their relations (FIX HERE)
      for (const genre of newGenres) {
        // Use upsert to handle existing genres
        const existingGenre = await tx.genres.findUnique({
          where: { category: genre.category! },
        });

        const genreId = existingGenre 
          ? existingGenre.id 
          : (await tx.genres.create({
              data: { category: genre.category! },
            })).id;

        await tx.book_genre.create({
          data: {
            book_id: bookId,
            genre_id: genreId,
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


// -----------------------------
// --- DELETE /api/books/:id ---
// -----------------------------
export async function deleteBook(req: Request, res: Response) {
	const bookId = await parseIdFromParams(req.params.id);

	const existingBook = await prisma.books.findUnique({ where: { id: bookId } });
	if (!existingBook) throw new NotFoundError("Book not found");

	await prisma.books.delete({ where: { id: bookId } });
	res.status(204).send();
}


// ---------------------------
// --------- helpers ---------
// ---------------------------
// Utility to ensure ISBN is unique
async function assertBooksIsbnUnique(isbn: string) {
	const existingBook = await prisma.books.findUnique({ where: { isbn } });
	if (existingBook)
		throw new ConflictError("A book with this ISBN already exists");
}
