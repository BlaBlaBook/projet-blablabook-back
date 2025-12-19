import request from "supertest";
import { getPrisma, type users } from "../../src/models/index.ts";
import { createTestApp } from "../setup/createTestApp.ts";
import crypto from "node:crypto";
import { mockUserId, getOrCreateTestUser } from "../utils/mockUser.ts";

const prisma = getPrisma();
const app = createTestApp();

let resetToken: string;
let testUser: users;

beforeAll(async () => {
	testUser = await getOrCreateTestUser();
});

beforeEach(async () => {
	resetToken = "valid-reset-token";
	await prisma.resetPasswordToken.create({
		data: {
			userId: mockUserId,
			tokenHash: crypto.createHash("sha256").update(resetToken).digest("hex"),
			expiresAt: new Date(Date.now() + 1000 * 60),
		},
	});
});

afterAll(async () => prisma.$disconnect());

describe("Password reset flow", () => {
  // -------- Test 1️⃣ --------
	it("always returns 204 for forgot-password", async () => {
		const res = await request(app)
			.post("/api/auth/forgot-password")
			.send({ email: testUser.email });

		expect(res.status).toBe(204);
	});

  // -------- Test 2️⃣ --------
	it("resets password with valid token", async () => {
		const res = await request(app).post("/api/auth/reset-password").send({
			token: resetToken,
			password: "NewPassword123!",
			confirmPassword: "NewPassword123!",
		});

		expect(res.status).toBe(204);
	});
});
