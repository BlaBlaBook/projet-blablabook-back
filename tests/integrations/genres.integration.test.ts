import request from "supertest";
import { getPrisma } from "../../src/models/index.ts";
import { createTestApp } from "../setup/createTestApp.ts";

const prisma = getPrisma();
const app = createTestApp();

describe("Genres API", () => {
	// -------- Test 1️⃣ --------
	it("GET /genres returns genres", async () => {
		// ACT
		const res = await request(app).get("/api/genres");
		expect(res.status).toBe(200);

		// ASSERT
		expect(Array.isArray(res.body)).toBe(true);
	});

	// -------- Test 2️⃣ --------
	it("DELETE /genres/:id deletes a genre", async () => {
		// ARRANGE
		const genre = await prisma.genres.create({
			data: { category: "Test Genre" },
		});

		// ACT
		const res = await request(app).delete(`/api/genres/${genre.id}`);
		expect(res.status).toBe(204);

		// ASSERT
		const deletedGenre = await prisma.genres.findUnique({
			where: { id: genre.id },
		});
		expect(deletedGenre).toBeNull();
	});
});
