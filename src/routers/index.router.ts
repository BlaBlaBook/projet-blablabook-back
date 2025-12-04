import { Router } from "express";
import { healthCheck } from "../controllers/main.controller.ts";
import { router as booksRouter } from "../routers/books.router.ts";

export const router = Router();

// Health
router.get("/health", healthCheck);

// Routers
router.use(booksRouter);