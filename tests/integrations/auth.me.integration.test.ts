import request from "supertest";
import { getPrisma, type users } from "../../src/models/index.ts";
import { createTestApp } from "../setup/createTestApp.ts";
import { getOrCreateTestUser, mockPassword } from "../utils/mockUser.ts";

const prisma = getPrisma();
const app = createTestApp();

let cookie: string;
let user: users;

beforeAll(async () => {
	user = await getOrCreateTestUser();

	const res = await request(app).post("/api/auth/login").send({
		email: user.email,
		password: mockPassword,
	});

	cookie = res.headers["set-cookie"];
});

afterAll(async () => prisma.$disconnect());

describe("/api/auth/me", () => {
	// -------- Test 1️⃣ --------
	it("GET returns current user", async () => {
		const res = await request(app)
			.get("/api/auth/me")
			.set("Cookie", cookie)
			.expect(200);

		expect(res.body.email).toBe(user.email);
	});

	// -------- Test 2️⃣ --------
	it("PATCH updates user", async () => {
		const res = await request(app)
			.patch("/api/auth/me")
			.set("Cookie", cookie)
			.send({ first_name: "John" })
			.expect(200);

		expect(res.body.first_name).toBe("John");
	});

	// -------- Test 3️⃣ --------
	it("DELETE removes user", async () => {
		const res = await request(app)
			.delete("/api/auth/me")
			.set("Cookie", cookie)
			.expect(200);

		expect(res.body.message).toBe("User deleted");
	});
});
