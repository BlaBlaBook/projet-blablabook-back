import crypto from "node:crypto";
import request from "supertest";
import { getPrisma } from "../../src/models/index.ts";
import { createTestApp } from "../setup/createTestApp.ts";
import { resetDb } from "../setup/resetDb.ts";
import { getOrCreateTestUser, mockUserId } from "../utils/mockUser.ts";

const prisma = getPrisma();
const app = createTestApp();

describe("Books API Integration", () => {
	beforeEach(async () => {
		await resetDb(prisma);
		await getOrCreateTestUser();
	});

	// -------- Test 1️⃣ --------
	it("GET /api/books returns paginated books with authors and genres", async () => {
		// ARRANGE
		const author = await prisma.authors.create({
			data: { first_name: "John", last_name: "Doe" },
		});
		const genre = await prisma.genres.create({ data: { category: "Sci-Fi" } });
		const book = await prisma.books.create({
			data: {
				id: crypto.randomUUID(),
				isbn: "1111111111",
				title: "Book 1",
				year: 2020,
				summary: "Test summary",
				language: "EN",
				pages: 200,
				image_url: "http://example.com/book.png",
				authors: { create: { author_id: author.id } },
				genres: { create: { genre_id: genre.id } },
			},
		});

		// ACT
		const res = await request(app).get("/api/books");

		// ASSERT
		expect(res.status).toBe(200);
		expect(res.body.count).toBe(1);
		expect(res.body.data[0]).toMatchObject({
			id: book.id,
			title: "Book 1",
			authors: [{ id: author.id, first_name: "John", last_name: "Doe" }],
			genres: [{ id: genre.id, category: "Sci-Fi" }],
		});
	});

	// -------- Test 2️⃣ --------
	it("GET /api/books/:id returns single book", async () => {
		// ARRANGE
		const book = await prisma.books.create({
			data: {
				id: crypto.randomUUID(),
				isbn: "2222222222",
				title: "Book 2",
				year: 2021,
				summary: "Summary",
				language: "EN",
				pages: 150,
				image_url: "http://example.com/book2.png",
			},
		});

		// ACT
		const res = await request(app).get(`/api/books/${book.id}`);

		// ASSERT
		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({ id: book.id, title: "Book 2" });
	});

	// -------- Test 3️⃣ --------
	it("POST /api/books creates a new book with authors and genres", async () => {
		// ARRANGE
		const author = await prisma.authors.create({
			data: { first_name: "Jane", last_name: "Smith" },
		});
		const genre = await prisma.genres.create({ data: { category: "Fantasy" } });

		// ACT
		const res = await request(app)
			.post("/api/books")
			.send({
				isbn: "3333333333",
				title: "New Book",
				year: 2022,
				summary: "New summary",
				language: "EN",
				pages: 300,
				image_url: "http://example.com/new.png",
				authors: [{ id: author.id }],
				genres: [{ id: genre.id }],
			});

		// ASSERT
		expect(res.status).toBe(201);
		expect(res.body).toMatchObject({
			title: "New Book",
			authors: [{ id: author.id }],
			genres: [{ id: genre.id }],
		});
	});

	// -------- Test 4️⃣ --------
	it("PATCH /api/books/:id updates book fields, authors, and genres", async () => {
		// ARRANGE
		const book = await prisma.books.create({
			data: {
				id: crypto.randomUUID(),
				isbn: "4444444444",
				title: "Old Title",
				year: 2020,
				summary: "Old summary",
				language: "EN",
				pages: 100,
				image_url: "http://example.com/old.png",
			},
		});
		const newAuthor = { first_name: "New", last_name: "Author" };
		const newGenre = { category: "New Genre" };

		// ACT
		const res = await request(app)
			.patch(`/api/books/${book.id}`)
			.send({
				title: "Updated Title",
				authors: [newAuthor],
				genres: [newGenre],
			});

		// ASSERT
		expect(res.status).toBe(200);
		expect(res.body.title).toBe("Updated Title");
		expect(res.body.authors[0].first_name).toBe("New");
		expect(res.body.genres[0].category).toBe("New Genre");
	});

	// -------- Test 5️⃣ --------
	it("DELETE /api/books/:id removes book", async () => {
		// ARRANGE
		const book = await prisma.books.create({
			data: {
				id: crypto.randomUUID(),
				isbn: "5555555555",
				title: "To Delete",
				year: 2020,
				summary: "Delete me",
				language: "EN",
				pages: 100,
				image_url: "http://example.com/delete.png",
			},
		});

		// ACT
		const res = await request(app).delete(`/api/books/${book.id}`);

		// ASSERT
		expect(res.status).toBe(204);
		const dbBook = await prisma.books.findUnique({ where: { id: book.id } });
		expect(dbBook).toBeNull();
	});

  // -------- Test 6️⃣ --------
	it("GET /api/books/:id/rating returns average rating", async () => {
		// ARRANGE
		const book = await prisma.books.create({
			data: {
				id: crypto.randomUUID(),
				isbn: "6666666666",
				title: "Rated Book",
				year: 2020,
				summary: "Rated",
				language: "EN",
				pages: 100,
				image_url: "http://example.com/rated.png",
			},
		});

		const newUser = await prisma.users.create({
			data: {
				email: "test@user.com",
				username: "testuser",
			},
		});
		const mockUserId2 = newUser.id;

		await prisma.user_book_records.createMany({
			data: [
				{ book_id: book.id, user_id: mockUserId, rating: 4 },
				{ book_id: book.id, user_id: mockUserId2, rating: 2 },
			],
		});

		// ACT
		const res = await request(app).get(`/api/books/${book.id}/rating`);

		// ASSERT
		expect(res.status).toBe(200);
		expect(res.body.averageRating).toBe(3);
		expect(res.body.count).toBe(2);
	});
});
