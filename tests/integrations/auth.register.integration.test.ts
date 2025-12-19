import request from "supertest";
import { getPrisma } from "../../src/models/index.ts";
import { createTestApp } from "../setup/createTestApp.ts";

const prisma = getPrisma();
const app = createTestApp();

afterAll(async () => prisma.$disconnect());

describe("POST /api/auth/register", () => {
  // -------- Test 1️⃣ --------
	it("creates a user and stores a hashed password", async () => {
		const res = await request(app)
			.post("/api/auth/register")
			.send({
				email: "register@test.com",
				username: "registeruser",
				password: "Password123!",
				confirmPassword: "Password123!",
			})
			.expect(201);

		expect(res.body.email).toBe("register@test.com");
		expect(res.body).not.toHaveProperty("password");

		const user = await prisma.users.findUnique({
			where: { email: "register@test.com" },
		});

		expect(user).not.toBeNull();
		expect(user?.password).not.toBe("Password123!");
	});

  // -------- Test 2️⃣ --------
	it("rejects duplicate email", async () => {
		const res = await request(app)
			.post("/api/auth/register")
			.send({
				email: "register@test.com",
				username: "another",
				password: "Password123!",
				confirmPassword: "Password123!",
			});

		expect(res.status).toBe(409);
	});
});
