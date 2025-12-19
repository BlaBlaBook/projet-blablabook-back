import crypto from "node:crypto";
import request from "supertest";
import { getPrisma } from "../../src/models/index.ts";
import { createTestApp } from "../setup/createTestApp.ts";
import { resetDb } from "../setup/resetDb.ts";
import { getOrCreateTestUser, mockUserId } from "../utils/mockUser.ts";

const prisma = getPrisma();
const app = createTestApp();

describe("User Library API Integration", () => {
	beforeEach(async () => {
		await resetDb(prisma);
		await getOrCreateTestUser();
	});

	// Helper: create book
	async function createBook() {
		return prisma.books.create({
			data: {
				id: crypto.randomUUID(),
				isbn: Math.floor(Math.random() * 10).toString(),
				title: "Test Book",
				year: 2024,
				summary: "Summary",
				language: "EN",
				pages: 200,
				image_url: "http://example.com/book.png",
			},
		});
	}

	// -------- Test 1️⃣ --------
	it("GET /api/users/library returns user's library", async () => {
		// ARRANGE
		const book = await createBook();

		await prisma.user_book_records.create({
			data: {
				user_id: mockUserId,
				book_id: book.id,
				reading_status: "lu",
			},
		});

		// ACT
		const res = await request(app).get("/api/users/library");

		// ASSERT
		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(1);
		expect(res.body[0]).toMatchObject({
			id: book.id,
			title: "Test Book",
			reading_status: "lu",
		});
	});

	// -------- Test 2️⃣ --------
	it("GET /api/users/library/:id returns a single book", async () => {
		// ARRANGE
		const book = await createBook();

		await prisma.user_book_records.create({
			data: {
				user_id: mockUserId,
				book_id: book.id,
				reading_status: "lu",
			},
		});

		// ACT
		const res = await request(app).get(`/api/users/library/${book.id}`);

		// ASSERT
		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({
			id: book.id,
			reading_status: "lu",
		});
	});

	// -------- Test 3️⃣ --------
	it("GET /api/users/library/:id returns 404 if not in library", async () => {
		// ARRANGE
		const book = await createBook();

		// ACT
		const res = await request(app).get(`/api/users/library/${book.id}`);

		// ASSERT
		expect(res.status).toBe(404);
	});

	// -------- Test 4️⃣ --------
	it("POST /api/users/library/:id adds book to library", async () => {
		// ARRANGE
		const book = await createBook();

		// ACT
		const res = await request(app).post(`/api/users/library/${book.id}`);

		// ASSERT
		expect(res.status).toBe(201);
		expect(res.body.message).toBe("Book added to library");

		const record = await prisma.user_book_records.findFirst({
			where: { user_id: mockUserId, book_id: book.id },
		});
		expect(record).not.toBeNull();
	});

	// -------- Test 5️⃣ --------
	it("POST /api/users/library/:id returns 409 if already exists", async () => {
		// ARRANGE
		const book = await createBook();

		await prisma.user_book_records.create({
			data: {
				user_id: mockUserId,
				book_id: book.id,
				reading_status: "lu",
			},
		});

		// ACT
		const res = await request(app).post(`/api/users/library/${book.id}`);

		// ASSERT
		expect(res.status).toBe(409);
	});

	// -------- Test 6️⃣ --------
	it("PATCH /api/users/library/:id updates reading status", async () => {
		// ARRANGE
		const book = await createBook();

		await prisma.user_book_records.create({
			data: {
				user_id: mockUserId,
				book_id: book.id,
				reading_status: "lu",
			},
		});

		// ACT
		const res = await request(app)
			.patch(`/api/users/library/${book.id}`)
			.send({ reading_status: "lu" });

		// ASSERT
		expect(res.status).toBe(200);
		expect(res.body.message).toBe("Reading status updated");

		const updated = await prisma.user_book_records.findFirst({
			where: { user_id: mockUserId, book_id: book.id },
		});
		expect(updated?.reading_status).toBe("lu");
	});

	// -------- Test 7️⃣ --------
	it("PATCH /api/users/library/:id returns 422 for invalid status", async () => {
		// ARRANGE
		const book = await createBook();

		await prisma.user_book_records.create({
			data: {
				user_id: mockUserId,
				book_id: book.id,
				reading_status: "lu",
			},
		});

		// ACT
		const res = await request(app)
			.patch(`/api/users/library/${book.id}`)
			.send({ reading_status: "invalid" });

		// ASSERT
		expect(res.status).toBe(422);
	});

	// -------- Test 8️⃣ --------
	it("PATCH /api/users/library/:id/rating updates rating", async () => {
		// ARRANGE
		const book = await createBook();

		await prisma.user_book_records.create({
			data: {
				user_id: mockUserId,
				book_id: book.id,
				reading_status: "lu",
			},
		});

		// ACT
		const res = await request(app)
			.patch(`/api/users/library/${book.id}/rating`)
			.send({ rating: 5 });

		// ASSERT
		expect(res.status).toBe(200);
		expect(res.body.record.rating).toBe(5);
	});

	// -------- Test 9️⃣ --------
	it("PATCH /api/users/library/:id/rating returns 400 for invalid rating", async () => {
		// ARRANGE
		const book = await createBook();

		await prisma.user_book_records.create({
			data: {
				user_id: mockUserId,
				book_id: book.id,
				reading_status: "lu",
			},
		});

		// ACT
		const res = await request(app)
			.patch(`/api/users/library/${book.id}/rating`)
			.send({ rating: 6 });

		// ASSERT
		expect(res.status).toBe(400);
	});

	// -------- Test 🔟 --------
	it("DELETE /api/users/library/:id removes book from library", async () => {
		// ARRANGE
		const book = await createBook();

		await prisma.user_book_records.create({
			data: {
				user_id: mockUserId,
				book_id: book.id,
				reading_status: "lu",
			},
		});

		// ACT
		const res = await request(app).delete(`/api/users/library/${book.id}`);

		// ASSERT
		expect(res.status).toBe(200);

		const record = await prisma.user_book_records.findFirst({
			where: { user_id: mockUserId, book_id: book.id },
		});
		expect(record).toBeNull();
	});
});
