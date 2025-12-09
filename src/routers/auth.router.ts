import { Router } from "express";
import { getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, deleteCurrentUser, updateCurrentUser } from "../controllers/auth.controller.ts"
import {  isAuth } from "../middlewares/isAuth.middleware.ts";

export const router = Router();

router.post("/auth/register", registerUser);
router.post("/auth/login", loginUser);
router.post("/auth/refresh", refreshAccessToken);
router.post("/auth/logout", isAuth, logoutUser);
router.get("/auth/me", isAuth, getCurrentUser);
router.delete("/auth/me", isAuth, deleteCurrentUser);
router.patch("/auth/me", isAuth, updateCurrentUser);