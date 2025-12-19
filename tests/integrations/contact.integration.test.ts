import request from "supertest";
import { vi } from "vitest";
import { createTestApp } from "../setup/createTestApp.ts";

// Mock the email sending function
vi.mock("../../src/lib/email.ts", () => ({
	sendContactEmail: vi.fn().mockResolvedValue(undefined),
}));

const app = createTestApp();

describe("Contact API Integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// -------- Test 1️⃣ POST /api/contact sends a message successfully --------
	it("POST /api/contact sends message successfully", async () => {
		const payload = {
			email: "test@example.com",
			subject: "Hello",
			message: "This is a test message.",
		};

		const res = await request(app).post("/api/contact").send(payload);

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		const { sendContactEmail } = await import("../../src/lib/email.ts");
		expect(sendContactEmail).toHaveBeenCalledWith(
			payload.email,
			payload.subject,
			"This is a test message.",
		);
	});

	// -------- Test 2️⃣ POST /api/contact fails with invalid email --------
	it("POST /api/contact fails with invalid email", async () => {
		const payload = {
			email: "invalid-email",
			subject: "Hello",
			message: "Test message",
		};

		const res = await request(app).post("/api/contact").send(payload);

		expect(res.status).toBe(422);
		expect(res.body).toHaveProperty("error");
		const { sendContactEmail } = await import("../../src/lib/email.ts");
		expect(sendContactEmail).not.toHaveBeenCalled();
	});

	// -------- Test 3️⃣ POST /api/contact fails with empty subject --------
	it("POST /api/contact fails with empty subject", async () => {
		const payload = {
			email: "test@example.com",
			subject: "",
			message: "Test message",
		};

		const res = await request(app).post("/api/contact").send(payload);

		expect(res.status).toBe(422);
		expect(res.body).toHaveProperty("error");
		const { sendContactEmail } = await import("../../src/lib/email.ts");
		expect(sendContactEmail).not.toHaveBeenCalled();
	});

	// -------- Test 4️⃣ POST /api/contact fails with empty message --------
	it("POST /api/contact fails with empty message", async () => {
		const payload = {
			email: "test@example.com",
			subject: "Hello",
			message: "",
		};

		const res = await request(app).post("/api/contact").send(payload);

		expect(res.status).toBe(422);
		expect(res.body).toHaveProperty("error");
		const { sendContactEmail } = await import("../../src/lib/email.ts");
		expect(sendContactEmail).not.toHaveBeenCalled();
	});

	// -------- Test 5️⃣ POST /api/contact sanitizes HTML input --------
	it("POST /api/contact sanitizes HTML in inputs", async () => {
		const payload = {
			email: "test@example.com",
			subject: "<b>Hello</b>",
			message: "<script>alert('xss')</script>Message",
		};

		await request(app).post("/api/contact").send(payload);
		const { sendContactEmail } = await import("../../src/lib/email.ts");
		expect(sendContactEmail).toHaveBeenCalledWith(
			"test@example.com",
			"<b>Hello</b>", // allowed harmless HTML tag
			"Message", // sanitized
		);
	});
});
