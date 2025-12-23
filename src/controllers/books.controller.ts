import type { Request, Response } from "express";
import { getPrisma } from "../models/index.ts";
import { parseIdFromParams } from "../lib/utils.ts";
import { NotFoundError } from "../lib/error.ts";
import { createBookSchema, updateBookSchema } from "../schemas/books.schema.ts";
import {
	formatBook,
	getUserRecordsInclude,
	assertBooksIsbnUnique,
	fetchBookWithRelations,
	buildBookFilters,
} from "../lib/books.ts";

const prisma = getPrisma();

// ----------------------------
// ------ GET /api/books ------
// ----------------------------
export async function getAllBooks(req: Request, res: Response) {
	const userId = req.userId;

	const limit = Number(req.query.limit ?? 20);
	const offset = Number(req.query.offset ?? 0);

	const where = buildBookFilters(req);

	// Prisma query
	const [books, total] = await Promise.all([
		prisma.books.findMany({
			where,
			skip: offset,
			take: limit,
			include: {
				authors: { include: { author: true } },
				genres: { include: { genre: true } },
				userRecords: getUserRecordsInclude(userId),
			},
		}),
		prisma.books.count({ where }),
	]);

	// Build res for client
	const formattedBooks = books.map((b) =>
		formatBook(b, { includeUser: !!userId }),
	);

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
	const book = await fetchBookWithRelations(bookId, userId);

	// Format response and send
	res.json(formatBook(book, { includeUser: !!userId }));
}

// -----------------------------
// ------ POST /api/books ------
// -----------------------------
export async function createBook(req: Request, res: Response) {
	const data = await createBookSchema.parseAsync(req.body);

	// Check if book already exist, if it does return 409 res along with the bookId
	const { exists, book } = await assertBooksIsbnUnique(data.isbn);
	if (exists) {
		return res
			.status(409)
			.send({
				message: "A book with this ISBN already exists",
				bookId: book?.id,
			});
	}

	// Only keep authors with id OR first_name + last_name
	const authorsToCreate = data.authors
		.map((a) => {
			if (a.id) {
				return { author: { connect: { id: a.id } } };
			}
			// Type guard: we know first_name and last_name exist
			if (a.first_name && a.last_name) {
				return {
					author: {
						connectOrCreate: {
							where: {
								first_name_last_name: {
									first_name: a.first_name,
									last_name: a.last_name,
								},
							},
							create: { first_name: a.first_name, last_name: a.last_name },
						},
					},
				};
			}
			// Skip invalid authors
			return null;
		})
		.filter((a): a is NonNullable<typeof a> => !!a);

	// Same for genres
	const genresToCreate = data.genres
		.map((g) => {
			if (g.id) return { genre: { connect: { id: g.id } } };
			if (g.category) {
				return {
					genre: {
						connectOrCreate: {
							where: { category: g.category },
							create: { category: g.category },
						},
					},
				};
			}
			return null;
		})
		.filter((g): g is NonNullable<typeof g> => !!g);

	// Then pass to Prisma
	const newBook = await prisma.books.create({
		data: {
			isbn: data.isbn,
			title: data.title,
			year: data.year,
			summary: data.summary,
			language: data.language,
			pages: data.pages,
			image_url: data.image_url,
			authors: { create: authorsToCreate },
			genres: { create: genresToCreate },
		},
		include: {
			authors: { include: { author: true } },
			genres: { include: { genre: true } },
		},
	});

	// Format response to hide pivot tables
	const formattedBook = formatBook(newBook);
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
		// If book already exist, if it does return 409 res along with the bookId
		const { exists, book } = await assertBooksIsbnUnique(updateData.isbn);
		if (exists) {
			return res
				.status(409)
				.send({
					message: "A book with this ISBN already exists",
					bookId: book?.id,
				});
		}
	};

	const { authors, genres, ...bookFields } = updateData;

	const updatedBook = await prisma.$transaction(async (tx) => {
		// Update base book fields
		await tx.books.update({ where: { id: bookId }, data: bookFields });

		// Handle authors
		if (authors) {
			await tx.book_author.deleteMany({ where: { book_id: bookId } });

			// Existing authors
			const existingAuthors = authors.filter(
				(a): a is { id: string } => !!a.id,
			);

			if (existingAuthors.length) {
				await tx.book_author.createMany({
					data: existingAuthors.map((a) => ({
						book_id: bookId,
						author_id: a.id,
					})),
				});
			}

			// New authors
			const newAuthors = authors.filter(
				(a): a is { first_name: string; last_name: string } =>
					!a.id && !!a.first_name && !!a.last_name,
			);

			for (const author of newAuthors) {
				const newAuthor = await tx.authors.create({
					data: {
						first_name: author.first_name,
						last_name: author.last_name,
					},
				});

				await tx.book_author.create({
					data: { book_id: bookId, author_id: newAuthor.id },
				});
			}
		}

		// Handle genres
		if (genres) {
			await tx.book_genre.deleteMany({ where: { book_id: bookId } });

			// Existing genres (by id)
			const existingGenres = genres.filter((g): g is { id: string } => !!g.id);
			if (existingGenres.length) {
				await tx.book_genre.createMany({
					data: existingGenres.map((g) => ({
						book_id: bookId,
						genre_id: g.id,
					})),
				});
			}

			// New genres (must have category)
			const newGenres = genres.filter(
				(g): g is { category: string } => !g.id && !!g.category,
			);

			for (const genre of newGenres) {
				const existingGenre = await tx.genres.findUnique({
					where: { category: genre.category },
				});

				const genreId =
					existingGenre?.id ??
					(await tx.genres.create({ data: { category: genre.category } })).id;

				await tx.book_genre.create({
					data: { book_id: bookId, genre_id: genreId },
				});
			}
		}

		// Fetch updated book with relations
		const bookWithRelations = await tx.books.findUnique({
			where: { id: bookId },
			include: {
				authors: { include: { author: true } },
				genres: { include: { genre: true } },
			},
		});

		if (!bookWithRelations) throw new NotFoundError("Updated book not found");
		return bookWithRelations;
	});

	const formattedBook = formatBook(updatedBook);

	// Format response
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

// ---------------------------------
// --- GET /api/books/:id/rating ---
// ---------------------------------
export async function getBookRating(req: Request, res: Response) {
	const bookId = await parseIdFromParams(req.params.id);

	// Fetch all ratings for this book
	const ratings = await prisma.user_book_records.findMany({
		where: { book_id: bookId, rating: { not: null } },
		select: { rating: true },
	});

	// Calculate average rating
	if (ratings.length === 0) {
		return res.json({ averageRating: null, count: 0 });
	}

	const sum = ratings.reduce((acc, curr) => acc + (curr.rating || 0), 0);
	const averageRating = sum / ratings.length;

	res.json({
		averageRating: parseFloat(averageRating.toFixed(1)),
		count: ratings.length,
	});
}
