import type { Request, Response } from "express";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { sendContactEmail } from "../lib/email.ts";

// Zod schema for validating inputs
const contactSchema = z.object({
	email: z.email("Invalid email address"),
	subject: z.string().min(1, "Subject is required").max(200),
	message: z.string().min(1, "Message is required").max(2000),
});


// -----------------------------------
// -------- POST /api/contact --------
// -----------------------------------
export async function sendMessage(req: Request, res: Response) {
	// 1. Validate inputs
	const { email, subject, message } = await contactSchema.parseAsync(
		req.body,
	);

	// 2. Sanitize inputs to prevent XSS
	const safeEmail = sanitizeHtml(email);
	const safeSubject = sanitizeHtml(subject);
	const safeMessage = sanitizeHtml(message).replace(/\n/g, "<br>");

  // 3. Send email
	await sendContactEmail(safeEmail, safeSubject, safeMessage)

	// 4. send success res to client
	return res.status(200).json({ success: true });
}
