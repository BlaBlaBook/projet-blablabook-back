/** biome-ignore-all lint/suspicious/noExplicitAny: we need 'any' here to mock functions return values for testing */
import type { NextFunction, Request, Response } from "express";
import { vi } from "vitest";
import { ForbiddenError } from "../../../src/lib/error.ts";
import { isAdmin } from "../../../src/middlewares/isAdmin.middleware.ts";

// ---- Mock dependencies ----
vi.mock("../../../src/lib/token.ts", () => ({
	extractAccessTokenFromRequest: vi.fn(),
	decodeJWT: vi.fn(),
}));

// ---- Import mocked modules ----
import { decodeJWT, extractAccessTokenFromRequest } from "../../../src/lib/token.ts";

// ---- Tests ----
describe("isAdmin middleware", () => {
	let req: Partial<Request>;
	let res: Partial<Response>;
	let next: NextFunction;

	beforeEach(() => {
		req = {};
		res = {};
		next = vi.fn();
		vi.clearAllMocks();
	});

  // -------- Test 1️⃣ --------
	it("calls next and sets userId/userRole when user is admin", async () => {
    // ARRANGE
		(extractAccessTokenFromRequest as any).mockReturnValue("token");
		(decodeJWT as any).mockReturnValue({ userId: "123", userRole: "admin" });

    // ACT
		await isAdmin(req as Request, res as Response, next);

    // ASSERT
		expect(req.userId).toBe("123");
		expect(req.userRole).toBe("admin");
		expect(next).toHaveBeenCalledWith();
	});

  // -------- Test 2️⃣ --------
	it("calls next with ForbiddenError if user is not admin", async () => {
    // ARRANGE
		(extractAccessTokenFromRequest as any).mockReturnValue("token");
		(decodeJWT as any).mockReturnValue({ userId: "456", userRole: "user" });

    // ACT
		await isAdmin(req as Request, res as Response, next);

    // ASSERT
		expect(next).toHaveBeenCalled();
		const calledWith = (next as any).mock.calls[0][0];
		expect(calledWith).toBeInstanceOf(ForbiddenError);
		expect(calledWith.message).toBe("You must be admin to access this route");
	});

  // -------- Test 3️⃣ --------
	it("calls next with error if extractAccessTokenFromRequest fails", async () => {
    // ARRANGE
		const tokenError = new Error("Token missing");
		(extractAccessTokenFromRequest as any).mockImplementation(() => {
			throw tokenError;
		});

    // ACT
		await isAdmin(req as Request, res as Response, next);

    // ASSERT
		expect(next).toHaveBeenCalledWith(tokenError);
	});

  // -------- Test 4️⃣ --------
	it("calls next with error if decodeJWT fails", async () => {
    // ARRANGE
		(extractAccessTokenFromRequest as any).mockReturnValue("token");
		const decodeError = new Error("Invalid token");
		(decodeJWT as any).mockImplementation(() => {
			throw decodeError;
		});

    // ACT
		await isAdmin(req as Request, res as Response, next);

    // ASSERT
		expect(next).toHaveBeenCalledWith(decodeError);
	});
});
