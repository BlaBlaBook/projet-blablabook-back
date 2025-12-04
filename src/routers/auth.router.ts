import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.ts"

export const router = Router();

router.post("/auth/register", registerUser);