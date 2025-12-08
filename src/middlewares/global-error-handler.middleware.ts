import type { NextFunction, Request, Response } from "express";
import z from "zod";
import { HttpError } from "../lib/error.ts";

// Global error handling middleware
export async function globalErrorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  
  // Zod validation error
  if (error instanceof z.ZodError) {
    console.info(error);
    res.status(422).json({ error: z.prettifyError(error) });
    return;
  }

  // HttpError type error
  if (error instanceof HttpError) {
    console.info(error);
    res.status(error.status).json({ error: error.message });
    return;
  }

  // Other unknown errors
  console.error(error);
  res.status(500).json({ error: "Unexpected server error" });
}
