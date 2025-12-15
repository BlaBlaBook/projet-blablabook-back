import { Router } from "express";
import { getCurrentUser, loginUser, logoutUser, registerUser, deleteCurrentUser, updateCurrentUser, regenerateAvatar } from "../controllers/auth.controller.ts"
import { isAuth } from "../middlewares/isAuth.middleware.ts";

export const router = Router();

router.post("/auth/register", registerUser);
router.post("/auth/login", loginUser);
router.post("/auth/logout", isAuth, logoutUser);
router.get("/auth/me", isAuth, getCurrentUser);
router.delete("/auth/me", isAuth, deleteCurrentUser);
router.patch("/auth/me", isAuth, updateCurrentUser);
router.post("/auth/avatar", isAuth, regenerateAvatar);