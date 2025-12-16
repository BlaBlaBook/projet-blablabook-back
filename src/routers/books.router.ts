import { Router } from "express";
import { createBook, deleteBook, getAllBooks, getBookById, updateBook, getBookRating } from "../controllers/books.controller.ts";
import { getUser } from "../middlewares/getUser.ts";
import { searchGoogleBooks } from "../controllers/booksSearch.controller.ts";
import { addComment, getCommentsByBook, toggleCommentLike } from "../controllers/comments.controller.ts";
import { isAuth } from "../middlewares/isAuth.middleware.ts";

export const router = Router();

router.get("/books", getUser, getAllBooks);
router.get("/books/lookup", searchGoogleBooks);
router.get("/books/:id", getUser, getBookById);
router.get("/books/:bookId/comments", getCommentsByBook);
router.post("/books", createBook);
router.post("/books/:bookId/comments", isAuth, addComment);
router.post("/books/:bookId/comments/:commentId/like", isAuth, toggleCommentLike);
router.patch("/books/:id", updateBook);
router.delete("/books/:id", deleteBook);
router.get("/books/:id/rating", getBookRating);