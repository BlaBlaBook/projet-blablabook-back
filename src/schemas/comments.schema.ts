import z from "zod";

export const commentContentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Le commentaire ne peut pas être vide")
    .max(5000, "Commentaire trop long"),
});

export const addCommentSchema = commentContentSchema.extend({
  parent_id: z.uuid().nullable().optional(),
});

export const updateCommentSchema = commentContentSchema;
