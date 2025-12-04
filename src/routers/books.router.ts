import { Router } from "express";
import { getAllBooks } from "../controllers/books.controller.ts";

export const router = Router();

router.get("/books", getAllBooks); 