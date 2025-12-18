import { Resend } from "resend";

// Get Resend config (API key, domain name, email receiver)
const resendApiKey = process.env.RESEND_API_KEY;
const resendDomainName = process.env.RESEND_DOMAIN_NAME;
const resendEmailReceiver = process.env.RESEND_EMAIL_RECEIVER;

// Warn if env vars are missing
if (!resendApiKey) console.warn("⚠️ Resend API key not set in .env");
if (!resendDomainName) console.warn("⚠️ Resend domain name not set in .env");
if (!resendEmailReceiver)
	console.warn("⚠️ Resend email receiver not set in .env");

// Create a new resend client
const resend = new Resend(resendApiKey);

// ---------------------------
// Send a reset password email
// ---------------------------
export async function sendResetPasswordEmail(email: string, resetLink: string) {
	await resend.emails.send({
		from: `no-reply@${resendDomainName}`,
		to: email,
		subject: "Réinitialisation de votre mot de passe",
		html: `
				<h1>Réinitialisation du mot de passe</h1>
				<p>Vous avez demandé à réinitialiser votre mot de passe.</p>
				<p>Cliquez sur ce lien pour choisir un nouveau mot de passe :</p>
				<p><a href="${resetLink}">${resetLink}</a></p>
				<p>Ce lien expire dans 30 minutes.</p>
				<p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
			`,
	});
}

// --------------------------
// -- Send a contact email --
// --------------------------
export async function sendContactEmail(email: string, subject: string, message: string) {
  await resend.emails.send({
		from: `contact@${resendDomainName}`,
		to: `${resendEmailReceiver}`,
		subject: subject,
		html: `
        <h1>New Contact Message</h1>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
	});
}
