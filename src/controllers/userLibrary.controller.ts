import type { Request, Response } from "express";
import { getPrisma, type reading_status } from "../models/index.ts";
import { parseIdFromParams } from "../lib/utils.ts";
import { NotFoundError, ConflictError, BadRequestError } from "../lib/error.ts";
import { changeReadingStatusSchema } from "../schemas/userLibrary.schema.ts";

const prisma = getPrisma();

// -----------------------------------
// --- GET /api/user-library/books ---
// -----------------------------------
export async function getUserLibraryBooks(req: Request, res: Response) {
	// userId guaranteed by isAuth middleware
	const userId = req.userId!;

	// Fetch all user's book records from database
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

	// Format data for frontend
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

// -----------------------------------
// -- GET /api/user-library/books/:id -
// -----------------------------------
export async function getUserLibraryBookById(req: Request, res: Response) {
	const userId = req.userId!; // guaranteed by isAuth
	const bookId = await parseIdFromParams(req.params.bookId);

	// Find the book record for this user
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

// -----------------------------------
// - POST /api/user-library/books/:id -
// -----------------------------------
export async function addBookToUserLibrary(req: Request, res: Response) {
	const userId = req.userId!;

	// Extract and validate book ID from URL params
	const bookId = await parseIdFromParams(req.params.bookId);

	// Check if book exists
	const book = await prisma.books.findUnique({ where: { id: bookId } });
	if (!book) throw new NotFoundError("Book not found");

	// Check if book is not already in user's library
	const alreadyExists = await prisma.user_book_records.findFirst({
		where: { user_id: userId, book_id: bookId },
	});
	if (alreadyExists) throw new ConflictError("Book already in user's library");

	// Create record in user_book_records
	const record = await prisma.user_book_records.create({
		data: {
			user: { connect: { id: userId } },
			book: { connect: { id: bookId } },
			reading_status: "à_lire" as reading_status, // ✅ Cast with imported type
		},
	});

	// Return success response
	res.status(201).json({
		message: "Book added to library",
		record,
	});
}

// Mapping front -> Prisma
const frontToPrismaStatusMap = {
	"à lire": "à_lire",
	"en cours": "en_cours",
	lu: "lu",
} as const;

// -----------------------------------
// - PATCH /api/user-library/books/:id -
// -----------------------------------
export async function changeStatusOfBook(req: Request, res: Response) {
	const userId = req.userId!;
	const bookId = await parseIdFromParams(req.params.bookId);
	const { reading_status: frontStatus } = await changeReadingStatusSchema.parseAsync(
		req.body,
	);

	const record = await prisma.user_book_records.findFirst({
		where: { user_id: userId, book_id: bookId },
	});
	if (!record) throw new NotFoundError("Book not found in user's library");

	// Map frontend status value to Prisma value
	const prismaStatus =
		frontToPrismaStatusMap[frontStatus as keyof typeof frontToPrismaStatusMap];

	// Update with mapped status
	const updatedRecord = await prisma.user_book_records.update({
		where: { id: record.id },
		data: { reading_status: prismaStatus as reading_status }, // ✅ Cast with imported type
	});

	res.json({
		message: "Reading status updated",
		record: updatedRecord,
	});
}

// -----------------------------------
// - DELETE /api/user-library/books/:id -
// -----------------------------------
export async function removeBookFromUserLibrary(req: Request, res: Response) {
	const userId = req.userId!;

	// Extract and validate book ID from URL params
	const bookId = await parseIdFromParams(req.params.bookId);

	// Check if book is in user's library
	const record = await prisma.user_book_records.findFirst({
		where: { user_id: userId, book_id: bookId },
	});
	if (!record) throw new NotFoundError("Book not found in user's library");

	// Delete the record
	await prisma.user_book_records.delete({
		where: { id: record.id },
	});

	res.status(200).json({
		message: "Book removed from library",
	});
}

// -----------------------------------
// - PATCH /api/user-library/books/:id/rating -
// -----------------------------------
export async function updateBookRating(req: Request, res: Response) {
	const userId = req.userId!;
	const bookId = req.params.bookId;
	const { rating } = req.body;

	// Validate rating
	if (!rating || rating < 1 || rating > 5) {
		throw new BadRequestError("Rating must be between 1 and 5");
	}

	const record = await prisma.user_book_records.findFirst({
		where: { user_id: userId, book_id: bookId },
	});

	if (!record) {
		throw new NotFoundError("Book not found in your library");
	}

	const updatedRecord = await prisma.user_book_records.update({
		where: { id: record.id },
		data: { rating },
	});

	res.json({ message: "Rating updated", record: updatedRecord });
}

// ------------------------------------------------------------
// - GET /api/users/library/recommendations/dashboard (internal) -
// ------------------------------------------------------------
export async function getDashboardRecommendations(req: Request, res: Response) {
	const userId = req.userId!;

	const userBookRecords = await prisma.user_book_records.findMany({
		where: { user_id: userId },
		include: {
			book: {
				include: {
					genres: { include: { genre: true } },
				},
			},
		},
	});

	// If user has no books, do not return default recommendations
	if (!userBookRecords.length) {
		return res.json({ data: [] });
	}

	const excludedBookIds = userBookRecords.map((r) => r.book_id);

	const genreCounts = new Map<string, number>();

	for (const record of userBookRecords) {
		for (const bg of record.book.genres) {
			const category = bg.genre.category;
			genreCounts.set(category, (genreCounts.get(category) ?? 0) + 1);
		}
	}

	const topGenres = [...genreCounts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3)
		.map(([category]) => category);

	const whereClause: any = {};

	if (excludedBookIds.length) {
		whereClause.id = { notIn: excludedBookIds };
	}

	if (topGenres.length) {
		whereClause.genres = {
			some: {
				genre: {
					category: { in: topGenres },
				},
			},
		};
	}

	const books = await prisma.books.findMany({
		where: whereClause,
		take: 4,
		orderBy: { created_at: "desc" },
		select: {
			id: true,
			title: true,
			image_url: true,
			genres: {
				take: 1,
				select: {
					genre: {
						select: {
							category: true,
						},
					},
				},
			},
		},
	});

	const data = books.map((b) => ({
		id: b.id,
		title: b.title,
		image_url: b.image_url,
		genre: b.genres[0]?.genre?.category ?? null,
	}));

	return res.json({ data });
}
