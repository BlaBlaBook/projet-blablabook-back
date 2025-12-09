import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { config } from "../../config.ts";

/**
 * Middleware to retrieve the authenticated user from the `accessToken` cookie.
 * - If the token is valid → req.userId is set
 * - If no token or invalid token → req.userId stays undefined (user is not authenticated)
 */
export const getUser = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken; // Read the "accessToken" cookie

  if (!token) return next(); // User not logged in
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.userId = payload.userId as string;
  } catch (err) {
    console.warn("Invalid JWT token:", err);
    // Continue the request even if the token is invalid
  }

  next();
};
