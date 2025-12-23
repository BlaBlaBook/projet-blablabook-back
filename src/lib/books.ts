import { ConflictError, NotFoundError } from "./error.ts";
import { getPrisma } from "../models/index.ts";
import type { Request } from "express";
import type {
	authors,
	books,
	genres,
	user_book_records,
} from "../models/index.ts";
import type { booksWhereInput } from "../../generated/prisma/models.ts";
import { normalizeQueryParam } from "./query.ts";
export type BookWithRelations = books & {
	authors: { author: authors }[];
	genres: { genre: genres }[];
	userRecords?: Pick<user_book_records, "reading_status" | "rating">[];
};

const prisma = getPrisma();

// --------------------------
// ---- Format book data ----
// --------------------------
export function formatBook(
	book: BookWithRelations,
	options?: { includeUser?: boolean },
) {
	return {
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
		reading_status: options?.includeUser
			? (book.userRecords?.[0]?.reading_status ?? null)
			: undefined,
		user_rating: options?.includeUser
			? (book.userRecords?.[0]?.rating ?? null)
			: undefined,
		created_at: book.created_at,
		updated_at: book.updated_at,
	};
}

// ------------------------------
// ---- User records include ----
// ------------------------------
export function getUserRecordsInclude(userId?: string) {
	return userId
		? {
				where: { user_id: userId },
				select: { reading_status: true, rating: true },
			}
		: false;
}

// -----------------------------------
// ---- Fetch book with relations ----
// -----------------------------------
export async function fetchBookWithRelations(bookId: string, userId?: string) {
	const book = await prisma.books.findUnique({
		where: { id: bookId },
		include: {
			authors: { include: { author: true } },
			genres: { include: { genre: true } },
			userRecords: getUserRecordsInclude(userId),
		},
	});

	if (!book) throw new NotFoundError("Book not found");
	return book;
}

// --------------------------------
// ---- Assert ISBN uniqueness ----
// --------------------------------
export async function assertBooksIsbnUnique(isbn: string) {
  const existingBook = await prisma.books.findUnique({ where: { isbn } });

  return {
    exists: !!existingBook,
    book: existingBook,
  };
}


// ----------------------------
// ---- Build book filters ----
// ----------------------------
export function buildBookFilters(req: Request): booksWhereInput {
	const where: booksWhereInput = {};
	const authorIds = normalizeQueryParam(req.query.authorIds);
	const genreIds = normalizeQueryParam(req.query.genreIds);
	const yearMin = req.query.yearMin ? Number(req.query.yearMin) : undefined;
	const yearMax = req.query.yearMax ? Number(req.query.yearMax) : undefined;
	const search = req.query.search as string | undefined;

	if (authorIds.length)
		where.authors = { some: { author_id: { in: authorIds } } };
	if (genreIds.length) where.genres = { some: { genre_id: { in: genreIds } } };
	if (yearMin || yearMax)
		where.year = {
			...(yearMin && { gte: yearMin }),
			...(yearMax && { lte: yearMax }),
		};
	if (search) where.title = { contains: search, mode: "insensitive" };

	return where;
}
