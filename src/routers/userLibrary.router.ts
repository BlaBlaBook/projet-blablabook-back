import { Router } from "express";
import { addBookToUserLibrary, getUserLibraryBooks, changeStatusOfBook, removeBookFromUserLibrary } from "../controllers/userLibrary.controller.ts";
import { isAuth } from "../middlewares/isAuth.middleware.ts";

export const router = Router();

// Récupérer tous les livres de la bibliothèque de l'utilisateur
router.get("/library", isAuth, getUserLibraryBooks);

// Ajouter un livre à la bibliothèque de l'utilisateur
router.post("/library/:bookId", isAuth, addBookToUserLibrary);

// Changer le statut de lecture d'un livre dans la bibliothèque
router.patch("/library/:bookId", isAuth, changeStatusOfBook);

// Dans ton fichier de routes (ex: userLibrary.routes.ts)
router.delete("/library/:bookId", isAuth, removeBookFromUserLibrary);
