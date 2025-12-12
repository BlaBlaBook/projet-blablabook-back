// utils/query.ts
import type { ParsedQs } from "qs";

/**
 * Normalise un param query en tableau de string.
 * Supporte : undefined, string, string[] ou ParsedQs[]
 */
export function normalizeQueryParam(
  param: string | ParsedQs | (string | ParsedQs)[] | undefined
): string[] {
  if (!param) return [];

  if (Array.isArray(param)) {
    // filtre uniquement les strings
    return param.filter((p): p is string => typeof p === "string");
  }

  return typeof param === "string" ? [param] : [];
}
