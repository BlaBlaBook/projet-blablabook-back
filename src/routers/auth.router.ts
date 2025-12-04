import { Router } from "express";
import { getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/auth.controller.ts"
import { allowRoles } from "../middlewares/allow-roles.middleware.ts";

export const router = Router();

router.post("/auth/register", registerUser);
router.post("/auth/login", loginUser);
router.post("/auth/refresh", refreshAccessToken);
router.post("/auth/logout", logoutUser);
router.get("/auth/me", allowRoles(["user", "admin"]), getCurrentUser);