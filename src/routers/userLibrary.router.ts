import { Router } from "express";
import { addBookToUserLibrary, getUserLibraryBooks, changeStatusOfBook, removeBookFromUserLibrary, getUserLibraryBookById, updateBookRating } from "../controllers/userLibrary.controller.ts";
import { isAuth } from "../middlewares/isAuth.middleware.ts";

/**
 * @swagger
 * tags:
 *   name: UserLibrary
 *   description: User library management operations
 */

export const router = Router();

/**
 * @swagger
 * /api/users/library:
 *   get:
 *     summary: Get all books in user's library
 *     tags: [UserLibrary]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of books in user's library
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserLibraryBook'
 */
// Récupérer tous les livres de la bibliothèque de l'utilisateur
router.get("/users/library", isAuth, getUserLibraryBooks);

/**
 * @swagger
 * /api/users/library/{bookId}:
 *   get:
 *     summary: Get a specific book from user's library
 *     tags: [UserLibrary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: The book ID
 *         example: "clh3j4k5l6m7n8o9p0q1"
 *     responses:
 *       200:
 *         description: Book details from user's library
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserLibraryBook'
 *       404:
 *         description: Book not found in user's library
 */
// Récupérer un livre spécifique de la bibliothèque de l'utilisateur
router.get("/users/library/:bookId", isAuth, getUserLibraryBookById);

/**
 * @swagger
 * /api/users/library/{bookId}:
 *   post:
 *     summary: Add a book to user's library
 *     tags: [UserLibrary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: The book ID to add
 *         example: "clh3j4k5l6m7n8o9p0q1"
 *     responses:
 *       201:
 *         description: Book added to library
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Book added to library"
 *                 record:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                     book_id:
 *                       type: string
 *                     reading_status:
 *                       type: string
 *                       example: "à_lire"
 *       404:
 *         description: Book not found
 *       409:
 *         description: Book already in user's library
 */
// Ajouter un livre à la bibliothèque de l'utilisateur
router.post("/users/library/:bookId", isAuth, addBookToUserLibrary);

/**
 * @swagger
 * /api/users/library/{bookId}:
 *   patch:
 *     summary: Change reading status of a book in user's library
 *     tags: [UserLibrary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: The book ID
 *         example: "clh3j4k5l6m7n8o9p0q1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reading_status
 *             properties:
 *               reading_status:
 *                 type: string
 *                 enum: ["à lire", "en cours", "lu"]
 *                 example: "lu"
 *                 description: New reading status
 *     responses:
 *       200:
 *         description: Reading status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Reading status updated"
 *                 record:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     reading_status:
 *                       type: string
 *                       example: "lu"
 *       404:
 *         description: Book not found in user's library
 */
// Changer le statut de lecture d'un livre dans la bibliothèque
router.patch("/users/library/:bookId", isAuth, changeStatusOfBook);

/**
 * @swagger
 * /api/users/library/{bookId}:
 *   delete:
 *     summary: Remove a book from user's library
 *     tags: [UserLibrary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: The book ID to remove
 *         example: "clh3j4k5l6m7n8o9p0q1"
 *     responses:
 *       200:
 *         description: Book removed from library
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Book removed from library"
 *       404:
 *         description: Book not found in user's library
 */
// Dans ton fichier de routes (ex: userLibrary.routes.ts)
router.delete("/users/library/:bookId", isAuth, removeBookFromUserLibrary);

/**
 * @swagger
 * /api/users/library/{bookId}/rating:
 *   patch:
 *     summary: Update book rating in user's library
 *     tags: [UserLibrary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: The book ID
 *         example: "clh3j4k5l6m7n8o9p0q1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *                 description: Book rating (1-5 stars)
 *     responses:
 *       200:
 *         description: Rating updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Rating updated"
 *                 record:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     rating:
 *                       type: integer
 *                       example: 4
 *       400:
 *         description: Rating must be between 1 and 5
 *       404:
 *         description: Book not found in your library
 */
// Modifier la note d'un livre dans la bibliothèque
router.patch("/users/library/:bookId/rating", isAuth, updateBookRating);
