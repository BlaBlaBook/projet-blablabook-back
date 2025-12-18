import { Router } from "express";
import { deleteGenre, getAllGenres } from "../controllers/genres.controller.ts";

/**
 * @swagger
 * tags:
 *   name: Genres
 *   description: Genre management operations
 */

export const router = Router();

/**
 * @swagger
 * /api/genres:
 *   get:
 *     summary: Get all genres
 *     tags: [Genres]
 *     responses:
 *       200:
 *         description: List of all genres
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
 *                   category:
 *                     type: string
 *                     example: "Fantasy"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 */
router.get("/genres", getAllGenres);

/**
 * @swagger
 * /api/genres/{id}:
 *   delete:
 *     summary: Delete a genre by ID
 *     tags: [Genres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The genre ID
 *         example: "clh3j4k5l6m7n8o9p0q1"
 *     responses:
 *       204:
 *         description: Genre deleted successfully
 *       404:
 *         description: Genre not found
 */
router.delete("/genres/:id", deleteGenre);