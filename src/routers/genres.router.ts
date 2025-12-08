import { Router } from "express";
import { getAllGenres } from "../controllers/genres.controller.ts";

export const router = Router();

router.get("/genres", getAllGenres);