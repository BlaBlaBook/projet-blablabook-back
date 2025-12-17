import request from "supertest";
import { getPrisma } from "../../src/models/index.ts";
import { createTestApp } from "../setup/createTestApp.ts";

const prisma = getPrisma();
const app = createTestApp();

describe("Authors API", () => {
	// -------- Test 1️⃣ --------
	it("GET /authors returns authors", async () => {
		// ACT
		const res = await request(app).get("/api/authors");
		expect(res.status).toBe(200);

		// ASSERT
		expect(Array.isArray(res.body)).toBe(true);
	});

	// -------- Test 2️⃣ --------
	it("DELETE /authors/:id deletes an author", async () => {
		// ARRANGE
		const author = await prisma.authors.create({
			data: { first_name: "Test", last_name: "Author" },
		});

		// ACT
		const res = await request(app).delete(`/api/authors/${author.id}`);

		// ASSERT
		expect(res.status).toBe(204);
	});
});
