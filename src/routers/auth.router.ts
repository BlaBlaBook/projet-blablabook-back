import { Router } from "express";
import {
	getCurrentUser,
	loginUser,
	logoutUser,
	registerUser,
	deleteCurrentUser,
	updateCurrentUser,
	googleAuth,
	regenerateAvatar,
	forgotPassword,
	resetPassword,
} from "../controllers/auth.controller.ts";
import { authRateLimiter } from "../middlewares/authRateLimit.middleware.ts";
import { isAuth } from "../middlewares/isAuth.middleware.ts";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication operations
 */

export const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: securePassword123!
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: securePassword123!
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 avatar_url:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request (validation error, email/username already exists, passwords don't match)
 */
router.post("/auth/register", authRateLimiter, registerUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: securePassword123!
 *     responses:
 *       200:
 *         description: Login successful (sets auth cookies)
 *       400:
 *         description: Invalid credentials or account created with Google OAuth
 */
router.post("/auth/login", authRateLimiter, loginUser);
/**
 * /api/auth/google:
 */
router.post("/auth/google", authRateLimiter, googleAuth);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       204:
 *         description: Password reset email sent (if email exists)
 */
router.post("/auth/forgot-password", authRateLimiter, forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token from email
 *                 example: abc123def456...
 *               password:
 *                 type: string
 *                 format: password
 *                 example: newSecurePassword123!
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: newSecurePassword123!
 *     responses:
 *       204:
 *         description: Password reset successful
 *       400:
 *         description: Invalid/expired token or passwords don't match
 */
router.post("/auth/reset-password", authRateLimiter, resetPassword);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Logout successful (clears auth cookies)
 *       401:
 *         description: Unauthenticated user
 */
router.post("/auth/logout", isAuth, logoutUser);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 username:
 *                   type: string
 *                 first_name:
 *                   type: string
 *                 last_name:
 *                   type: string
 *                 bio:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *                 avatar_url:
 *                   type: string
 *                 avatar_seed:
 *                   type: string
 *                 role:
 *                   type: string
 *                 hasPassword:
 *                   type: boolean
 *       404:
 *         description: No user associated with this token
 */
router.get("/auth/me", isAuth, getCurrentUser);

/**
 * @swagger
 * /api/auth/me:
 *   delete:
 *     summary: Delete current user account
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted
 */
router.delete("/auth/me", isAuth, deleteCurrentUser);

/**
 * @swagger
 * /api/auth/me:
 *   patch:
 *     summary: Update current user information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: new_username
 *               email:
 *                 type: string
 *                 format: email
 *                 example: new@example.com
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               avatar_url:
 *                 type: string
 *                 format: url
 *                 example: https://example.com/avatar.jpg
 *               bio:
 *                 type: string
 *                 example: "I love reading books!"
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Required if user has a password and wants to change it
 *                 example: oldPassword123!
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password
 *                 example: newPassword123!
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Must match newPassword
 *                 example: newPassword123!
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error, email/username already exists, or password mismatch
 *       403:
 *         description: Current password incorrect
 */
router.patch("/auth/me", isAuth, updateCurrentUser);

/**
 * @swagger
 * /api/auth/avatar:
 *   post:
 *     summary: Regenerate user avatar
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar regenerated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Avatar regenerated successfully
 *                 avatar_url:
 *                   type: string
 *                   description: New avatar URL
 */
router.post("/auth/avatar", isAuth, regenerateAvatar);
