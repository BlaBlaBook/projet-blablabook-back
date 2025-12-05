import z from "zod";

export const bookBaseSchema = z.object({
  isbn: z.string().min(13).max(17),
  title: z.string().min(1).max(255),
  year: z.number().int(),
  summary: z.string().min(1),
  language: z.string().length(2),
  pages: z.number().int().min(1),
  image_url: z.url().max(255),
});

// Author object: either existing by id or new with first_name + last_name
const bookAuthorSchema = z.object({
  id: z.uuid().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
}).refine(a => a.id || (a.first_name && a.last_name), {
  message: "Either id or first_name + last_name must be provided",
});

// Genre object: either existing by id or new with category
const bookGenreSchema = z.object({
  id: z.uuid().optional(),
  category: z.string().optional(),
}).refine(g => g.id || g.category, {
  message: "Either id or category must be provided",
});

export const createBookSchema = bookBaseSchema.extend({
  authors: z.array(bookAuthorSchema).min(1),
  genres: z.array(bookGenreSchema).min(1),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;

// Update: all fields optional (including relations), but at least one required
export const updateBookSchema = bookBaseSchema
  .partial()
  .extend({
    authors: z.array(bookAuthorSchema).min(1).optional(),
    genres: z.array(bookGenreSchema).min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateBookInput = z.infer<typeof updateBookSchema>;