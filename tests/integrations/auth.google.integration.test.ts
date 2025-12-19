import request from "supertest";
import { createTestApp } from "../setup/createTestApp.ts";
import { vi } from "vitest";

vi.mock("../../src/lib/googleAuth", () => ({
	loginWithGoogle: vi.fn(async (_code, res) => {
		res.cookie("accessToken", "mock");
		res.cookie("refreshToken", "mock");
	}),
	googleCodeSchema: {
		parseAsync: vi.fn(async () => ({ code: "mock" })),
	},
}));

const app = createTestApp();

describe("POST /api/auth/google", () => {
	it("logs in user via google oauth", async () => {
		const res = await request(app)
			.post("/api/auth/google")
			.send({ code: "mock" })
			.expect(200);

		expect(res.headers["set-cookie"]).toBeDefined();
	});
});
