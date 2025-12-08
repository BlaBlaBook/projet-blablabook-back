import { Router } from "express";
import { deleteGenre, getAllGenres } from "../controllers/genres.controller.ts";

export const router = Router();

router.get("/genres", getAllGenres);
router.delete("/genres/:id", deleteGenre);