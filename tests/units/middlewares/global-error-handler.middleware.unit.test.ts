/** biome-ignore-all lint/suspicious/noExplicitAny: mocks need 'any' to simulate Express req/res objects */
import type { NextFunction, Request, Response } from "express";
import { vi } from "vitest";
import z from "zod";
import { HttpError } from "../../../src/lib/error.ts";
import { globalErrorHandler } from "../../../src/middlewares/global-error-handler.middleware.ts";

describe("globalErrorHandler middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  // -------- Test 1️⃣ --------
  it("returns 422 for ZodError", async () => {
    // ARRANGE
    const zodError = new z.ZodError([]);

    // ACT
    await globalErrorHandler(zodError, req as Request, res as Response, next);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: z.prettifyError(zodError),
    });
  });

  // -------- Test 2️⃣ --------
  it("returns correct status and message for HttpError", async () => {
    // ARRANGE
    const httpError = new HttpError("Not allowed", 403);

    // ACT
    await globalErrorHandler(httpError, req as Request, res as Response, next);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Not allowed" });
  });

  // -------- Test 3️⃣ --------
  it("returns 500 for unknown errors", async () => {
    // ARRANGE
    const unknownError = new Error("Something went wrong");

    // ACT
    await globalErrorHandler(unknownError, req as Request, res as Response, next);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Unexpected server error" });
  });
});
