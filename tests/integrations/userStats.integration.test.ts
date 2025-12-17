import crypto from "node:crypto";
import request from "supertest";
import { getPrisma } from "../../src/models/index.ts";
import { createTestApp } from "../setup/createTestApp.ts";
import { getOrCreateTestUser } from "../utils/mockUser.ts";

const prisma = getPrisma();
const app = createTestApp();

describe("User Stats API", () => {
	it("GET /users/stats returns comment and reply counts", async () => {
		// ARRANGE
		const testUser = await getOrCreateTestUser();

		// Create a test book
		const testBook = await prisma.books.create({
			data: {
				id: crypto.randomUUID(),
				isbn: "1234567890",
				title: "Test Book",
				year: 2025,
				summary: "Test book summary",
				language: "EN",
				pages: 100,
				image_url: "http://example.com/image.png",
			},
		});

		// Create comments
		const parentComment = await prisma.comments.create({
			data: {
				user_id: testUser.id,
				book_id: testBook.id,
				content: "Parent comment",
			},
		});

		// Create reply
		await prisma.comments.create({
			data: {
				user_id: testUser.id,
				book_id: testBook.id,
				content: "Reply comment",
				parent_id: parentComment.id,
			},
		});

		// ACT
		const res = await request(app).get("/api/users/stats");

		// ASSERT
		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			commentsCount: 1,
			repliesCount: 1,
		});
	});
});
