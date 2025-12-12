import type { Request, Response, NextFunction } from "express";
import { extractAccessTokenFromRequest, decodeJWT } from "../lib/token.ts";
import { attemptRefresh } from "../lib/auth.ts";
import { UnauthorizedError } from "../lib/error.ts";

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    // Try with access token first
    const token = extractAccessTokenFromRequest(req);

    const { userId, userRole } = decodeJWT(token);
    req.userId = userId;
    req.userRole = userRole;

    return next();
  } catch (error) {
    // If the access token is expired → try refresh, but DO NOT block the request
    if (error instanceof UnauthorizedError) {
      try {
        const { accessToken } = await attemptRefresh(req, res);
        const { userId, userRole } = decodeJWT(accessToken);

        req.userId = userId;
        req.userRole = userRole;

        return next();
      } catch {
        // Refresh failed → user stays unauthenticated silently
        return next();
      }
    }

    // Any other error (JWT malformed, wrong signature...) → ignore
    return next();
  }
}
