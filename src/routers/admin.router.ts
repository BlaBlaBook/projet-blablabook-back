import { Router } from "express";
import { getAllUsers, deleteUserById } from "../controllers/admin.controller.ts"
import {  isAuth } from "../middlewares/isAuth.middleware.ts";
import { isAdmin } from "../middlewares/isAdmin.middleware.ts";

export const router = Router();

router.get("/admin/users", isAuth, isAdmin, getAllUsers);
router.delete("/admin/users/:userId", isAuth, isAdmin, deleteUserById);