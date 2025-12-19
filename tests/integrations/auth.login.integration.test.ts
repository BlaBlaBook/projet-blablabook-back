import request from "supertest";
import { getPrisma, type users } from "../../src/models/index.ts";
import { createTestApp } from "../setup/createTestApp.ts";
import {
	getOrCreateTestUser,
	mockPassword,
	mockUserEmail,
} from "../utils/mockUser.ts";
import { resetDb } from "../setup/resetDb.ts";

const prisma = getPrisma();
const app = createTestApp();
let user: users;

beforeAll(async () => {
	await resetDb(prisma);
	user = await getOrCreateTestUser();
});

afterAll(async () => prisma.$disconnect());

describe("POST /api/auth/login", () => {
	// -------- Test 1️⃣ --------
	it("logs in and sets cookies", async () => {
		const res = await request(app)
			.post("/api/auth/login")
			.set("Content-Type", "application/json")
			.send({
				email: mockUserEmail,
				password: mockPassword,
			})
			.expect(200);

		expect(res.headers["set-cookie"]).toBeDefined();
	});

	// -------- Test 2️⃣ --------
	it("rejects wrong password", async () => {
		const res = await request(app).post("/api/auth/login").send({
			email: user.email,
			password: "WrongPassword",
		});

		expect(res.status).toBe(400);
	});
});
