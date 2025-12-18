import { Router } from "express";
import { getAllUsers, deleteUserById } from "../controllers/admin.controller.ts"
import { isAuth } from "../middlewares/isAuth.middleware.ts";
import { isAdmin } from "../middlewares/isAdmin.middleware.ts";

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin operations
 */

export const router = Router();

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       email:
 *                         type: string
 *                       username:
 *                         type: string
 *                       role:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 */
router.get("/admin/users", isAuth, isAdmin, getAllUsers);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       403:
 *         description: Admin user cannot be deleted
 *       404:
 *         description: User not found
 */
router.delete("/admin/users/:userId", isAuth, isAdmin, deleteUserById);