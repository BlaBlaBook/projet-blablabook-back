import { Router } from "express";
import { deleteAuthor, getAllAuthors } from "../controllers/authors.controller.ts";

export const router = Router();

router.get("/authors", getAllAuthors); 
router.delete("/authors/:id", deleteAuthor);