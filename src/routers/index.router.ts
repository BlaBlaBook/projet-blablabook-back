import { Router } from "express";
import { healthCheck } from "../controllers/main.controller.ts";
import { router as authRouter } from "../routers/auth.router.ts"

export const router = Router();

// Health
router.get("/health", healthCheck);

router.use(authRouter);