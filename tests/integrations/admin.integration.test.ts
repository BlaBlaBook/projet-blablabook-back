import request from "supertest";
import { getPrisma } from "../../src/models/index.ts";
import { createTestApp } from "../setup/createTestApp.ts";
import { getOrCreateTestAdmin, mockAdminId } from "../utils/mockUser.ts";

const prisma = getPrisma();
const app = createTestApp();

beforeAll(async () => {
	await getOrCreateTestAdmin();
});

afterAll(async () => {
	await prisma.$disconnect();
});

describe("Admin Users Routes", () => {
	describe("GET /api/admin/users", () => {
		// -------- Test 1️⃣ --------
		it("should return all users", async () => {
			// ACT
			const res = await request(app).get("/api/admin/users").expect(200);

			// ASSERT
			expect(res.body).toHaveProperty("users");
			expect(Array.isArray(res.body.users)).toBe(true);
			expect(res.body.users.length).toBeGreaterThanOrEqual(1);
			expect(res.body.users[0]).toHaveProperty("id");
			expect(res.body.users[0]).toHaveProperty("email");
		});
	});

	// -------- Test 2️⃣ --------
	it("should delete a non-admin user", async () => {
		// ARRANGE
		const userToDelete = await prisma.users.create({
			data: {
				email: "delete@test.com",
				username: "deleteuser",
				role: "user",
			},
		});

		// ACT
		const res = await request(app).delete(
			`/api/admin/users/${userToDelete.id}`,
		);

		// ASSERT
		expect(res.status).toBe(204);
		const deleted = await prisma.users.findUnique({
			where: { id: userToDelete.id },
		});
		expect(deleted).toBeNull();
	});

	// -------- Test 3️⃣ --------
	it("should throw ForbiddenError when trying to delete an admin", async () => {
		// ACT
		const res = await request(app).delete(`/api/admin/users/${mockAdminId}`);

		// ASSERT
		expect(res.status).toBe(403);
	});

	// -------- Test 4️⃣ --------
	it("should throw NotFoundError if user does not exist", async () => {
		// ACT
		const res = await request(app).delete(
			`/api/admin/users/f53142be-1af5-4735-a6ab-aee017e1615c`,
		);

		// ASSERT
		expect(res.status).toBe(404);
	});
});
