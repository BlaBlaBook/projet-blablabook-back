import argon2 from "argon2";
import { BadRequestError } from "./error.ts";
import crypto from "node:crypto";

type PasswordChangeParams = {
  userHasPassword: boolean;
  storedPassword?: string | null;
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
};

// ----------------------------
// Hash a password using argon2
// ----------------------------
export async function hashPassword(password: string) {
	return argon2.hash(password);
}

// ----------------------------------
// Verify hashed password and new one
// ----------------------------------
export async function verifyPassword(hashed: string, plain: string) {
	const isMatching = await argon2.verify(hashed, plain);
	if (!isMatching) {
		throw new BadRequestError("Email and password do not match");
	}
}


// -------------------------------------
// Control passwords to authorize change
// -------------------------------------
export async function validatePasswordChange({
	userHasPassword,
	storedPassword,
	currentPassword,
	newPassword,
	confirmPassword,
}: PasswordChangeParams) {
	if (userHasPassword) {
		if (!currentPassword) {
			throw new BadRequestError("Current password is required");
		}

		if (!storedPassword) {
			throw new BadRequestError("Stored password is required");
		}

		await verifyPassword(storedPassword, currentPassword);
	}

	if (newPassword !== confirmPassword) {
		throw new BadRequestError("Passwords do not match");
	}

	return hashPassword(newPassword);
}

// ----------------------------------------------------
// Generate a reset password token with expiration date
// ----------------------------------------------------
export async function generateResetToken() {
	// Generate secure reset token
	const token = crypto.randomBytes(32).toString("hex");
	const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

	// Token expiration (30 minutes)
	const expiresAt = new Date();
	expiresAt.setMinutes(expiresAt.getMinutes() + 30);

  return { token, tokenHash, expiresAt };
}
