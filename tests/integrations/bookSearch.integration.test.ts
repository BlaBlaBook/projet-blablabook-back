import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "../setup/createTestApp.ts";

const app = createTestApp();

describe("Books API – Google Books search", () => {
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;

	beforeAll(() => {
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterAll(() => {
		consoleLogSpy.mockRestore(); // restores the original console.log
	});

	beforeEach(() => {
		process.env.GOOGLE_BOOKS_API_KEY = "test-api-key";
	});

	// -------- Test 1️⃣ --------
	it("returns 500 if Google API key is missing", async () => {
		// ARRANGE
		delete process.env.GOOGLE_BOOKS_API_KEY;

		// ACT
		const res = await request(app).get("/api/books/lookup?q=test");

		// ASSERT
		expect(res.status).toBe(500);
	});

	// -------- Test 2️⃣ --------
	it("returns 400 if no query params provided", async () => {
		// ACT
		const res = await request(app).get("/api/books/lookup");

		// ASSERT
		expect(res.status).toBe(400);
		expect(res.body.error).toMatch(
			"Missing search parameter: provide either 'isbn' for exact search or 'title'/'keyword' as 'q'",
		);
	});

	// -------- Test 3️⃣ --------
	it("calls Google Books API and returns sanitized results", async () => {
		// ARRANGE
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				items: [
					// ✅ Valid FR book
					{
						volumeInfo: {
							title: "Livre FR",
							language: "fr",
							publishedDate: "2020-01-01",
							pageCount: 300,
							description: "Description FR",
							industryIdentifiers: [
								{ type: "ISBN_13", identifier: "9781234567890" },
							],
							authors: ["Jean Dupont"],
							categories: ["Roman"],
							imageLinks: {
								thumbnail: "http://img.com/test?zoom=1",
							},
						},
					},

					// ❌ No ISBN
					{
						volumeInfo: {
							title: "No ISBN",
							language: "fr",
						},
					},

					// ❌ Unsupported language
					{
						volumeInfo: {
							title: "German Book",
							language: "de",
							industryIdentifiers: [
								{ type: "ISBN_13", identifier: "9780000000000" },
							],
						},
					},

					// ✅ Valid EN book
					{
						volumeInfo: {
							title: "English Book",
							language: "en",
							publishedDate: "2018",
							pageCount: 150,
							industryIdentifiers: [
								{ type: "ISBN_10", identifier: "1234567890" },
							],
							authors: ["John Smith"],
							categories: ["Fiction"],
							imageLinks: {
								thumbnail: "http://img.com/test?zoom=1",
							},
						},
					},
				],
			}),
		});

		vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

		// ACT
		const res = await request(app).get("/api/books/lookup?q=harry potter");

		// ASSERT
		expect(res.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledOnce();

		// Only 2 valid books should remain
		expect(res.body).toHaveLength(2);

		// FR book first
		expect(res.body[0]).toMatchObject({
			title: "Livre FR",
			language: "fr",
			isbn: "9781234567890",
			year: 2020,
			pages: 300,
			image_url: "http://img.com/test?zoom=2",
		});

		expect(res.body[1]).toMatchObject({
			title: "English Book",
			language: "en",
			isbn: "1234567890",
			year: 2018,
		});
	});

	// -------- Test 4️⃣ --------
	it("returns empty array if Google returns no items", async () => {
		// ARRANGE
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ items: [] }),
			}) as unknown as typeof fetch,
		);

		// ACT
		const res = await request(app).get("/api/books/lookup?q=unknown");

		// ASSERT
		expect(res.status).toBe(200);
		expect(res.body).toEqual([]);
	});

	// -------- Test 5️⃣ --------
	it("returns 500 if Google API responds with error", async () => {
		// ARRANGE
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				text: async () => "Google error",
			}) as unknown as typeof fetch,
		);

		// ACT
		const res = await request(app).get("/api/books/lookup?q=test");

		// ASSERT
		expect(res.status).toBe(500);
	});
});
