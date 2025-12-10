import type { Request, Response } from "express";
import { Resend } from "resend";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

// Get Resend config (API key, domain name, email receiver)
const resendApiKey = process.env.RESEND_API_KEY;
const resendDomainName = process.env.RESEND_DOMAIN_NAME;
const resendEmailReceiver = process.env.RESEND_EMAIL_RECEIVER;

// Warn if env vars are missing
if (!resendApiKey) console.warn("⚠️ Resend API key not set in .env");
if (!resendDomainName) console.warn("⚠️ Resend domain name not set in .env");
if (!resendEmailReceiver) console.warn("⚠️ Resend email receiver not set in .env");

// Create a new resend client
const resend = new Resend(resendApiKey);

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
	await resend.emails.send({
		from: `contact@${resendDomainName}`,
		to: `${resendEmailReceiver}`,
		subject: safeSubject,
		html: `
        <h1>New Contact Message</h1>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Message:</strong><br/>${safeMessage}</p>
      `,
	});

	return res.status(200).json({ success: true });
}
