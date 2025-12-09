import { Router } from "express";
import { addBookToUserLibrary, getUserLibraryBooks, changeStatusOfBook, removeBookFromUserLibrary, getUserLibraryBookById } from "../controllers/userLibrary.controller.ts";
import { isAuth } from "../middlewares/isAuth.middleware.ts";

export const router = Router();

// Récupérer tous les livres de la bibliothèque de l'utilisateur
router.get("/users/library", isAuth, getUserLibraryBooks);

// Récupérer un livre spécifique de la bibliothèque de l'utilisateur
router.get("/users/library/:bookId", isAuth, getUserLibraryBookById);

// Ajouter un livre à la bibliothèque de l'utilisateur
router.post("/users/library/:bookId", isAuth, addBookToUserLibrary);

// Changer le statut de lecture d'un livre dans la bibliothèque
router.patch("/users/library/:bookId", isAuth, changeStatusOfBook);

// Dans ton fichier de routes (ex: userLibrary.routes.ts)
router.delete("/users/library/:bookId", isAuth, removeBookFromUserLibrary);
