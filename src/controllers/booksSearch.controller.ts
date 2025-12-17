import type { Request, Response } from "express";
import { BadRequestError } from "../lib/error.ts";
import type {
	GoogleBooksQuery,
	GoogleBooksAPIResponse,
	GoogleBookItem,
} from "../@types/googleBooks.ts";
import {
	createBookSchema,
	type CreateBookInput,
} from "../schemas/books.schema.ts";

// -----------------------------------
// --- GET /api/books/search ---------
// -----------------------------------
export async function searchGoogleBooks(req: Request, res: Response) {
	// Extract query parameters: 'isbn' for exact search or 'q' for keyword search
	const { q, isbn } = req.query as unknown as GoogleBooksQuery;

	// Validate that at least one search parameter is provided
	if (!isbn && !q) {
		throw new BadRequestError(
			"Missing search parameter: provide either 'isbn' for exact search or 'title'/'keyword' as 'q'",
		);
	}

	// Retrieve Google Books API key from environment variables
	const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
	if (!apiKey) throw new Error("Google Books API key not set");

	// Build search query: prefix with "isbn:" for ISBN search, otherwise use keyword
	const searchQuery = isbn
		? `isbn:${encodeURIComponent(isbn)}`
		: encodeURIComponent(q!).replace(/%20/g, "+");

	// Construct the Google Books API URL
	const url = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&country=FR&langRestrict=fr&orderBy=relevance&maxResults=30&key=${apiKey}`;

	try {
		// Call the Google Books API
		const response = await fetch(url);
		if (!response.ok) {
			console.error(
				"Google Books API error:",
				response.status,
				await response.text(),
			);
			throw new Error("Google Books API request failed");
		}

		const data: GoogleBooksAPIResponse = await response.json();
		console.log(
			`Number of Google results received: ${data.items?.length ?? 0}`,
		);

		// Transform Google Books results into CreateBookInput format
		const books: CreateBookInput[] = (data.items ?? [])
			.map((item: GoogleBookItem) => {
				const info = item.volumeInfo;

				// Extract ISBN (prioritize ISBN_13 over ISBN_10)
				const isbnValue =
					info.industryIdentifiers?.find((id) => id.type === "ISBN_13")
						?.identifier ??
					info.industryIdentifiers?.find((id) => id.type === "ISBN_10")
						?.identifier;

				// Skip books without ISBN
				if (!isbnValue) return null;

				// Skip books not in French or English language
				const lang = item.volumeInfo.language;
				if (lang !== "fr" && lang !== "en") return null;

				// Extract year from publication date
				let yearNum = 0;
				if (info.publishedDate) {
					const yearMatch = info.publishedDate.match(/\d{4}/);
					if (yearMatch) yearNum = parseInt(yearMatch[0], 10);
				}

				// Transform authors array into { first_name, last_name } objects
				const authors = (info.authors ?? ["Unknown Author"]).map((name) => {
					const [first_name, ...rest] = name.split(" ");
					return { first_name, last_name: rest.join(" ") || "Unknown" };
				});

				// Transform categories into genres array
				const genres = (info.categories ?? ["Unknown"]).map((category) => ({
					category: category,
				}));

				// Validate and return book data using schema
				try {
					return createBookSchema.parse({
						isbn: isbnValue,
						title: info.title ?? "No title",
						year: yearNum || 2000,
						summary: info.description ?? "No description",
						language: info.language?.slice(0, 2) ?? "en",
						pages: info.pageCount && info.pageCount > 0 ? info.pageCount : 1,
						image_url:
							info.imageLinks?.thumbnail?.replace("zoom=1", "zoom=2") ?? null,
						authors,
						genres,
					});
				} catch {
					console.warn("Book skipped (failed schema validation):", info.title);
					return null;
				}
			})
			.filter((book): book is CreateBookInput => book !== null)
			.sort((a, b) => {
				// French first, then English
				if (a.language === b.language) return 0;
				return a.language === "fr" ? -1 : 1;
			});

		res.json(books);
	} catch (err) {
		console.error("Error in Google Books endpoint:", err);
		throw err;
	}
}
