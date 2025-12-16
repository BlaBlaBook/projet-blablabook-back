import { Router } from "express";
import { healthCheck } from "../controllers/main.controller.ts";
import { router as booksRouter } from "./books.router.ts";
import { router as authRouter } from "./auth.router.ts";
import { router as authorsRouter } from "./authors.routes.ts";
import { router as genresRouter } from "./genres.router.ts";
import { router as userLibraryRouter } from "./userLibrary.router.ts";
import { router as adminRouter } from "./admin.router.ts";
import { router as contactRouter } from "./contact.routes.ts";
import { router as userStatsRouter } from "./userStats.router.ts"

export const router = Router();

router.get("/health", healthCheck);

router.use(adminRouter);
router.use(booksRouter);
router.use(authRouter);
router.use(authorsRouter);
router.use(genresRouter);
router.use(userLibraryRouter);
router.use(contactRouter);
router.use(userStatsRouter);
