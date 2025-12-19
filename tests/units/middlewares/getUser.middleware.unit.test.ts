/** biome-ignore-all lint/suspicious/noExplicitAny: we need 'any' here to mock functions return values for testing */
import type { NextFunction, Request, Response } from "express";
import { vi } from "vitest";
import { UnauthorizedError } from "../../../src/lib/error.ts";
import { getUser } from "../../../src/middlewares/getUser.ts";

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
import { decodeJWT, extractAccessTokenFromRequest } from "../../../src/lib/token.ts";

// ---- Tests ----
describe("getUser middleware", () => {
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
		await getUser(req as Request, res as Response, next);

    // ASSERT
		expect(req.userId).toBe("123");
		expect(req.userRole).toBe("user");
		expect(next).toHaveBeenCalledWith();
	});

  // -------- Test 2️⃣ --------
	it("tries refresh if access token expired and sets userId/userRole", async () => {
    // ARRANGE
		(extractAccessTokenFromRequest as any).mockImplementation(() => {
			throw new UnauthorizedError("Token expired");
		});
		(attemptRefresh as any).mockResolvedValue({ accessToken: "new-token" });
		(decodeJWT as any).mockReturnValue({ userId: "456", userRole: "admin" });

    // ACT
		await getUser(req as Request, res as Response, next);

    // ASSERT
		expect(attemptRefresh).toHaveBeenCalledWith(req, res);
		expect(req.userId).toBe("456");
		expect(req.userRole).toBe("admin");
		expect(next).toHaveBeenCalledWith();
	});

  // -------- Test 3️⃣ --------
	it("calls next without setting user if refresh fails", async () => {
    // ARRANGE
		(extractAccessTokenFromRequest as any).mockImplementation(() => {
			throw new UnauthorizedError("Token expired");
		});
		(attemptRefresh as any).mockRejectedValue(new Error("Refresh failed"));

    // ACT
		await getUser(req as Request, res as Response, next);

    // ASSERT
		expect(req.userId).toBeUndefined();
		expect(req.userRole).toBeUndefined();
		expect(next).toHaveBeenCalledWith();
	});

  // -------- Test 4️⃣ --------
	it("calls next without setting user if token is invalid", async () => {
    // ARRANGE
		const error = new Error("Invalid token");
		(extractAccessTokenFromRequest as any).mockImplementation(() => {
			throw error;
		});

    // ACT
		await getUser(req as Request, res as Response, next);

    // ASSERT
		expect(req.userId).toBeUndefined();
		expect(req.userRole).toBeUndefined();
		expect(next).toHaveBeenCalledWith();
	});
});
