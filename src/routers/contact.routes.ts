import { Router } from "express";
import { sendMessage } from "../controllers/contact.controller.ts";

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact form operations
 */

export const router = Router();

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Send a contact message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Sender's email address
 *               subject:
 *                 type: string
 *                 maxLength: 200
 *                 example: Question about your service
 *                 description: Message subject
 *               message:
 *                 type: string
 *                 maxLength: 2000
 *                 example: Hello, I have a question about your book platform...
 *                 description: Message content
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid input (email format, missing fields, etc.)
 */
router.post("/contact", sendMessage);
