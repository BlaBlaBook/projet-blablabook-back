import { Router } from "express";
import { deleteAuthor, getAllAuthors } from "../controllers/authors.controller.ts";

/**
 * @swagger
 * tags:
 *   name: Authors
 *   description: Author management operations
 */

export const router = Router();

/**
 * @swagger
 * /api/authors:
 *   get:
 *     summary: Get all authors
 *     tags: [Authors]
 *     responses:
 *       200:
 *         description: List of all authors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "clh3j4k5l6m7n8o9p0q1"
 *                   name:
 *                     type: string
 *                     example: "J.K. Rowling"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 */
router.get("/authors", getAllAuthors); 

/**
 * @swagger
 * /api/authors/{id}:
 *   delete:
 *     summary: Delete an author by ID
 *     tags: [Authors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The author ID
 *         example: "clh3j4k5l6m7n8o9p0q1"
 *     responses:
 *       204:
 *         description: Author deleted successfully
 *       404:
 *         description: Author not found
 */
router.delete("/authors/:id", deleteAuthor);