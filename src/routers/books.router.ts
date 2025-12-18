import { Router } from "express";
import { createBook, deleteBook, getAllBooks, getBookById, updateBook, getBookRating } from "../controllers/books.controller.ts";
import { getUser } from "../middlewares/getUser.ts";
import { searchGoogleBooks } from "../controllers/booksSearch.controller.ts";
import { addComment, getCommentsByBook, toggleCommentLike } from "../controllers/comments.controller.ts";
import { isAuth } from "../middlewares/isAuth.middleware.ts";

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: Book management operations
 */

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Book comments operations
 */

export const router = Router();

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all books with filters
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of books to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *       - in: query
 *         name: authorIds
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by author IDs
 *       - in: query
 *         name: genreIds
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by genre IDs
 *       - in: query
 *         name: yearMin
 *         schema:
 *           type: integer
 *         description: Minimum publication year
 *       - in: query
 *         name: yearMax
 *         schema:
 *           type: integer
 *         description: Maximum publication year
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title
 *     responses:
 *       200:
 *         description: List of books with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of books matching filters
 *                 limit:
 *                   type: integer
 *                   description: Number of books returned
 *                 offset:
 *                   type: integer
 *                   description: Pagination offset
 *                 count:
 *                   type: integer
 *                   description: Number of books in this response
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 */
router.get("/books", getUser, getAllBooks);

/**
 * @swagger
 * /api/books/lookup:
 *   get:
 *     summary: Search books in Google Books API
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: startIndex
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination start index
 *       - in: query
 *         name: maxResults
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Google Books API search results
 */
router.get("/books/lookup", searchGoogleBooks);

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Get book by ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The book ID
 *         example: "clh3j4k5l6m7n8o9p0q1"
 *     responses:
 *       200:
 *         description: Book details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookDetail'
 *       404:
 *         description: Book not found
 */
router.get("/books/:id", getUser, getBookById);

/**
 * @swagger
 * /api/books/{bookId}/comments:
 *   get:
 *     summary: Get comments for a book
 *     tags: [Comments]
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
 *         description: List of comments for the book
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
router.get("/books/:bookId/comments", getCommentsByBook);

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isbn
 *               - title
 *               - year
 *               - language
 *               - pages
 *               - authors
 *               - genres
 *             properties:
 *               isbn:
 *                 type: string
 *                 example: "978-0747532743"
 *               title:
 *                 type: string
 *                 example: "Harry Potter and the Philosopher's Stone"
 *               year:
 *                 type: integer
 *                 example: 1997
 *               summary:
 *                 type: string
 *                 example: "A boy wizard discovers his magical heritage..."
 *               language:
 *                 type: string
 *                 example: "English"
 *               pages:
 *                 type: integer
 *                 example: 223
 *               image_url:
 *                 type: string
 *                 format: url
 *                 example: "https://example.com/book-cover.jpg"
 *               authors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Existing author ID
 *                     first_name:
 *                       type: string
 *                       description: New author first name
 *                     last_name:
 *                       type: string
 *                       description: New author last name
 *               genres:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Existing genre ID
 *                     category:
 *                       type: string
 *                       description: New genre category
 *     responses:
 *       201:
 *         description: Book created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookDetail'
 *       409:
 *         description: Book with this ISBN already exists
 */
router.post("/books", createBook);

/**
 * @swagger
 * /api/books/{bookId}/comments:
 *   post:
 *     summary: Add a comment to a book
 *     tags: [Comments]
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Great book! I really enjoyed reading it."
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthenticated user
 */
router.post("/books/:bookId/comments", isAuth, addComment);

/**
 * @swagger
 * /api/books/{bookId}/comments/{commentId}/like:
 *   post:
 *     summary: Toggle like on a comment
 *     tags: [Comments]
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
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The comment ID
 *         example: "clh3j4k5l6m7n8o9p0q2"
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Like toggled"
 *                 isLiked:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthenticated user
 */
router.post("/books/:bookId/comments/:commentId/like", isAuth, toggleCommentLike);

/**
 * @swagger
 * /api/books/{id}:
 *   patch:
 *     summary: Update a book
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               isbn:
 *                 type: string
 *                 example: "978-0747532743"
 *               title:
 *                 type: string
 *                 example: "Harry Potter and the Philosopher's Stone"
 *               year:
 *                 type: integer
 *                 example: 1997
 *               summary:
 *                 type: string
 *                 example: "A boy wizard discovers his magical heritage..."
 *               language:
 *                 type: string
 *                 example: "English"
 *               pages:
 *                 type: integer
 *                 example: 223
 *               image_url:
 *                 type: string
 *                 format: url
 *                 example: "https://example.com/book-cover.jpg"
 *               authors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Existing author ID
 *                     first_name:
 *                       type: string
 *                       description: New author first name
 *                     last_name:
 *                       type: string
 *                       description: New author last name
 *               genres:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Existing genre ID
 *                     category:
 *                       type: string
 *                       description: New genre category
 *     responses:
 *       200:
 *         description: Book updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookDetail'
 *       404:
 *         description: Book not found
 */
router.patch("/books/:id", updateBook);

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: Delete a book
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The book ID
 *         example: "clh3j4k5l6m7n8o9p0q1"
 *     responses:
 *       204:
 *         description: Book deleted successfully
 *       404:
 *         description: Book not found
 */
router.delete("/books/:id", deleteBook);

/**
 * @swagger
 * /api/books/{id}/rating:
 *   get:
 *     summary: Get average rating for a book
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The book ID
 *         example: "clh3j4k5l6m7n8o9p0q1"
 *     responses:
 *       200:
 *         description: Average rating and count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageRating:
 *                   type: number
 *                   format: float
 *                   example: 4.5
 *                   nullable: true
 *                 count:
 *                   type: integer
 *                   example: 10
 */
router.get("/books/:id/rating", getBookRating);