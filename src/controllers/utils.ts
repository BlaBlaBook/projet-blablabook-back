import z from "zod";

export async function parseIdFromParams(id: unknown) {
  const idSchema = z.uuid("The ID parameter should be a valid UUID");
  return await idSchema.parseAsync(id);
}
