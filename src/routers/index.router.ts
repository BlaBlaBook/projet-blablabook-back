import { Router } from "express";
import { healthCheck } from "../controllers/main.controller.ts";
import { router as booksRouter } from "../routers/books.router.ts";
import { router as authRouter } from "../routers/auth.router.ts"
import { router as authorsRouter } from "../routers/authors.routes.ts";
import { router as genresRouter } from "../routers/genres.router.ts";
import { router as userLibrary } from "../routers/userLibrary.router.ts";

export const router = Router();

// Health
router.get("/health", healthCheck);

// Routers
router.use(booksRouter);
router.use(authRouter);
router.use(authorsRouter);
router.use(genresRouter)
router.use(userLibrary)