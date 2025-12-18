import { Router } from "express";
import { getUserStats } from "../controllers/userStats.controller.ts";
import { isAuth } from "../middlewares/isAuth.middleware.ts";

/**
 * @swagger
 * tags:
 *   name: UserStats
 *   description: User statistics operations
 */

export const router = Router();

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [UserStats]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve statistics about the current user's activity on the platform
 *     responses:
 *       200:
 *         description: User statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 commentsCount:
 *                   type: integer
 *                   description: Number of comments posted by the user
 *                   example: 15
 *                 repliesCount:
 *                   type: integer
 *                   description: Number of replies posted by the user
 *                   example: 8
 *       500:
 *         description: Internal server error
 */
router.get("/users/stats", isAuth, getUserStats);
