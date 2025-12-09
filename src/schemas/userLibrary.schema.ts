import { z } from "zod";

// Statuts visibles côté front
export const changeReadingStatusSchema = z.object({
  reading_status: z.enum(["à lire", "en cours", "lu"]),
});

export type ChangeReadingStatusInput = z.infer<typeof changeReadingStatusSchema>;
