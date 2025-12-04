import z from "zod";

export async function parseIdFromParams(id: unknown) {
  const idSchema = z.uuid("The ID parameter should be a valid UUID")
  return await idSchema.parseAsync(id);
}

export const passwordValidationSchema = z.string()
  .min(8, "password should contain at least 8 caracters")
  .regex(/[a-z]/, "password should contain at least one lowercased letter")
  .regex(/[A-Z]/, "password should contain at least one uppercased letter")
  .regex(/[0-9]/, "password should contain at least one digit")
  .regex(/[!@#$%^&*_-]/, "password should contain at least one of these special caracter: ! @ # $ % ^ & * _ -");