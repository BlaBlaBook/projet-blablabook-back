import crypto from "node:crypto";
import request from "supertest";
import { getPrisma } from "../../src/models/index.ts";
import { createTestApp } from "../setup/createTestApp.ts";
import { resetDb } from "../setup/resetDb.ts";
import { getOrCreateTestUser, mockUserId } from "../utils/mockUser.ts";

const prisma = getPrisma();
const app = createTestApp();

describe("Comments API Integration", () => {
	beforeEach(async () => {
		await resetDb(prisma);
		await getOrCreateTestUser();
	});

	// -------- Test 1️⃣ --------
	it("GET /api/books/:bookId/comments returns comments with user info and likes", async () => {
		// ARRANGE
		const book = await prisma.books.create({
			data: {
				id: crypto.randomUUID(),
				isbn: "1234567890",
				title: "Test Book",
				year: 2023,
				summary: "Summary",
				language: "EN",
				pages: 100,
				image_url: "http://example.com/book.png",
			},
		});

		const comment = await prisma.comments.create({
			data: {
				content: "Great book!",
				user: { connect: { id: mockUserId } },
				book: { connect: { id: book.id } },
			},
		});

		// ACT
		const res = await request(app).get(`/api/books/${book.id}/comments`);

		// ASSERT
		expect(res.status).toBe(200);
		expect(res.body.comments).toHaveLength(1);
		expect(res.body.comments[0]).toMatchObject({
			id: comment.id,
			content: "Great book!",
			user: { id: mockUserId },
			likesCount: 0,
		});
	});

	// -------- Test 2️⃣ --------
	it("POST /api/books/:bookId/comments creates a new comment", async () => {
		// ARRANGE
		const book = await prisma.books.create({
			data: {
				id: crypto.randomUUID(),
				isbn: "0987654321",
				title: "Another Book",
				year: 2023,
				summary: "Summary",
				language: "EN",
				pages: 150,
				image_url: "http://example.com/book2.png",
			},
		});

		// ACT
		const res = await request(app)
			.post(`/api/books/${book.id}/comments`)
			.send({ content: "Amazing read!" });

		// ASSERT
		expect(res.status).toBe(201);
		expect(res.body.content).toBe("Amazing read!");
		expect(res.body.user.id).toBe(mockUserId);
		expect(res.body.likesCount).toBe(0);
	});

	// -------- Test 3️⃣ --------
	it("POST /api/books/:bookId/comments fails with empty content", async () => {
    // ARRANGE
		const book = await prisma.books.create({
			data: {
				id: crypto.randomUUID(),
				isbn: "1122334455",
				title: "Fail Book",
				year: 2023,
				summary: "Summary",
				language: "EN",
				pages: 120,
				image_url: "http://example.com/book3.png",
			},
		});

    // ACT
		const res = await request(app)
			.post(`/api/books/${book.id}/comments`)
			.send({ content: "" });

    // ASSERT
		expect(res.status).toBe(400);
	});

	// -------- Test 4️⃣ --------
	it("PATCH /api/books/:bookId/comments/:id/like toggles a comment like", async () => {
		// ARRANGE
		const book = await prisma.books.create({
			data: {
				id: crypto.randomUUID(),
				isbn: "5566778899",
				title: "Like Book",
				year: 2023,
				summary: "Summary",
				language: "EN",
				pages: 200,
				image_url: "http://example.com/book4.png",
			},
		});

		const comment = await prisma.comments.create({
			data: {
				content: "Like this comment",
				user: { connect: { id: mockUserId } },
				book: { connect: { id: book.id } },
			},
		});

		// ACT: like
		let res = await request(app).post(`/api/books/${book.id}/comments/${comment.id}/like`);

    // ASSERT: like
		expect(res.status).toBe(200);
		expect(res.body.liked).toBe(true);

		// ACT: unlike
		res = await request(app).post(`/api/books/${book.id}/comments/${comment.id}/like`);

    // ASSERT: unlike
		expect(res.status).toBe(200);
		expect(res.body.liked).toBe(false);
	});
});
