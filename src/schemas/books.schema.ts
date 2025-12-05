import z from "zod";

// Base schema for shared fields
export const bookBaseSchema = z.object({
  isbn: z.string().min(13).max(17),
  title: z.string().min(1).max(255),
  year: z.number().int(),
  summary: z.string().min(1),
  language: z.string().length(2),
  pages: z.number().int().min(1),
  image_url: z.url().max(255),
});

// Create: all fields required
export const createBookSchema = bookBaseSchema;
export type CreateBookInput = z.infer<typeof createBookSchema>;

// Update: all fields optional, but at least one required
export const updateBookSchema = bookBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateBookInput = z.infer<typeof updateBookSchema>;
