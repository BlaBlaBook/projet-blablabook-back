import type { NextFunction, Request, Response } from "express";
import { vi } from "vitest";
import { mockUserId, mockAdminId } from "../utils/mockUser.ts";
import { globalErrorHandler } from "../../src/middlewares/global-error-handler.middleware.ts";

// ------------ Mock isAuth ------------
vi.mock("../../src/middlewares/isAuth.middleware.ts", () => ({
  isAuth: (req: Request, _res: Response, next: NextFunction) => {
    // Set a dummy userId for tests
    req.userId = mockUserId;
    next();
  },
}));

// ------------ Mock isAdmin ------------
vi.mock("../../src/middlewares/isAdmin.middleware.ts", () => ({
  isAdmin: (req: Request, _res: Response, next: NextFunction) => {
    // Set a dummy userId and userRole for tests
    req.userId = mockAdminId;
		req.userRole = "admin";
    next();
  },
}));

// ------------ Imports ------------
import express from "express";
import { router as booksRouter } from "../../src/routers/books.router.ts";
import { router as authRouter } from "../../src/routers/auth.router.ts";
import { router as authorsRouter } from "../../src/routers/authors.routes.ts";
import { router as genresRouter } from "../../src/routers/genres.router.ts";
import { router as userLibraryRouter } from "../../src/routers/userLibrary.router.ts";
import { router as adminRouter } from "../../src/routers/admin.router.ts";
import { router as contactRouter } from "../../src/routers/contact.routes.ts";
import { router as userStatsRouter } from "../../src/routers/userStats.router.ts";

// -------- Create test app --------
export function createTestApp() {
	const app = express();
	app.use(express.json());

	app.use("/api", adminRouter);
	app.use("/api", booksRouter);
	app.use("/api", authRouter);
	app.use("/api", authorsRouter);
	app.use("/api", genresRouter);
	app.use("/api", userLibraryRouter);
	app.use("/api", contactRouter);
	app.use("/api", userStatsRouter);

	app.use(globalErrorHandler);

	return app;
}
