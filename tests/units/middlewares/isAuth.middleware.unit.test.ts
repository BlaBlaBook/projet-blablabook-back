/** biome-ignore-all lint/suspicious/noExplicitAny: we need 'any' here to mock functions return values for testing */
import type { NextFunction, Request, Response } from "express";
import { vi } from "vitest";
import { UnauthorizedError } from "../../../src/lib/error.ts";
import { isAuth } from "../../../src/middlewares/isAuth.middleware.ts";

// ---- Mock dependencies ----
vi.mock("../../../src/lib/token.ts", () => ({
	extractAccessTokenFromRequest: vi.fn(),
	decodeJWT: vi.fn(),
}));

vi.mock("../../../src/lib/auth.ts", () => ({
	attemptRefresh: vi.fn(),
}));

// ---- Import mocked modules ----
import { attemptRefresh } from "../../../src/lib/auth.ts";
import {
	decodeJWT,
	extractAccessTokenFromRequest,
} from "../../../src/lib/token.ts";

// ---- Tests ----
describe("isAuth middleware", () => {
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
	it("calls next and sets userId/userRole when access token is valid", async () => {
    // ARRANGE
		(extractAccessTokenFromRequest as any).mockReturnValue("valid-token");
		(decodeJWT as any).mockReturnValue({ userId: "123", userRole: "user" });

    // ACT
		await isAuth(req as Request, res as Response, next);

    // ASSERT
		expect(req.userId).toBe("123");
		expect(req.userRole).toBe("user");
		expect(next).toHaveBeenCalledWith();
	});

  // -------- Test 2️⃣ --------
	it("attempts refresh when access token is expired and succeeds", async () => {
    // ARRANGE
		(extractAccessTokenFromRequest as any).mockImplementation(() => {
			throw new UnauthorizedError("Token expired");
		});
		(attemptRefresh as any).mockResolvedValue({ accessToken: "new-token" });
		(decodeJWT as any).mockReturnValue({ userId: "456", userRole: "admin" });

    // ACT
		await isAuth(req as Request, res as Response, next);

    // ASSERT
		expect(attemptRefresh).toHaveBeenCalledWith(req, res);
		expect(req.userId).toBe("456");
		expect(req.userRole).toBe("admin");
		expect(next).toHaveBeenCalledWith();
	});

  // -------- Test 3️⃣ --------
	it("calls next with error if refresh fails", async () => {
    // ARRANGE
		(extractAccessTokenFromRequest as any).mockImplementation(() => {
			throw new UnauthorizedError("Token expired");
		});
		const refreshError = new Error("Refresh failed");
		(attemptRefresh as any).mockRejectedValue(refreshError);

    // ACT
		await isAuth(req as Request, res as Response, next);

    // ASSERT
		expect(next).toHaveBeenCalledWith(refreshError);
	});

  // -------- Test 4️⃣ --------
	it("calls next with error if token is invalid", async () => {
    // ARRANGE
		const error = new Error("Invalid token");
		(extractAccessTokenFromRequest as any).mockImplementation(() => {
			throw error;
		});

    // ACT
		await isAuth(req as Request, res as Response, next);

    // ASSERT
		expect(next).toHaveBeenCalledWith(error);
	});
});
