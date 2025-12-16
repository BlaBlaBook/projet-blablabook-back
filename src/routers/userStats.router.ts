import { Router } from "express";
import { getUserStats } from "../controllers/userStats.controller.ts";
import { isAuth } from "../middlewares/isAuth.middleware.ts";

export const router = Router();

router.get("/users/stats", isAuth, getUserStats);
