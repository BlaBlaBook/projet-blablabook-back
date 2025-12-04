import { Router } from "express";
import { createBook, getAllBooks, getBookById } from "../controllers/books.controller.ts";

export const router = Router();

router.get("/books", getAllBooks); 

router.get("/books/:id", getBookById);

router.post("/books", createBook);