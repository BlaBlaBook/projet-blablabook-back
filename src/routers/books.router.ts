import { Router } from "express";
import { createBook, deleteBook, getAllBooks, getBookById, updateBook } from "../controllers/books.controller.ts";
import { de } from "zod/locales";

export const router = Router();

router.get("/books", getAllBooks); 

router.get("/books/:id", getBookById);

router.post("/books", createBook);

router.patch("/books/:id", updateBook);

router.delete("/books/:id", deleteBook);