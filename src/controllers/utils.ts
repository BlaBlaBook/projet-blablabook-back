import z from "zod";

export async function parseIdFromParams(id: unknown) {
  const idSchema = z
    .coerce  // permet de transformer STRING -> NUMBER
    .number("The ID parameter should be a valid integer") // on valide le number
    .int() // le number est un entier
    .min(1); // supérieur ou égal à 1
  return await idSchema.parseAsync(id);
}

export const passwordValidationSchema = z.string()
  .min(8, "password should contain at least 8 caracters")
  .regex(/[a-z]/, "password should contain at least one lowercased letter")
  .regex(/[A-Z]/, "password should contain at least one uppercased letter")
  .regex(/[0-9]/, "password should contain at least one digit")
  .regex(/[!@#$%^&*_-]/, "password should contain at least one of these special caracter: ! @ # $ % ^ & * _ -");