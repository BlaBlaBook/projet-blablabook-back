import z from "zod";

export const passwordValidationSchema = z
	.string()
	.min(8, "password should contain at least 8 caracters")
	.regex(/[a-z]/, "password should contain at least one lowercased letter")
	.regex(/[A-Z]/, "password should contain at least one uppercased letter")
	.regex(/[0-9]/, "password should contain at least one digit")
	.regex(
		/[!@#$%^&*_-]/,
		"password should contain at least one of these special caracter: ! @ # $ % ^ & * _ -",
	);

export const registerSchema = z.object({
	username: z.string().min(1),
	email: z.email(),
	password: passwordValidationSchema,
	confirmPassword: passwordValidationSchema,
});

export const loginSchema = z.object({
	email: z.email(),
	password: z.string(),
});

export const updateUserSchema = z.object({
	username: z.string().min(1).optional(),
	email: z.email().optional(),
	first_name: z.string().optional(),
	last_name: z.string().optional(),
	avatar_url: z.url().optional(),
	currentPassword: passwordValidationSchema.optional(),
	newPassword: passwordValidationSchema.optional(),
	confirmPassword: passwordValidationSchema.optional(),
});
