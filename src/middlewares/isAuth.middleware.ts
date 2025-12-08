import type { NextFunction, Request, Response } from "express";
import { extractAccessTokenFromRequest, decodeJWT } from "../lib/token.ts";
import { attemptRefresh } from "../lib/auth.ts";

export async function isAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Try access token
    const token = extractAccessTokenFromRequest(req);
    const { userId, userRole } = decodeJWT(token);

    req.userId = userId;
    req.userRole = userRole;
    return next();

  } catch (error) {
    // Type guard for error
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // AccessToken expired → try refresh
    if (!errorMessage.includes("expired")) {
      // Other JWT error → invalid token
      return next(error);
    }

    // Attempt silent refresh
    try {
      const { accessToken } = await attemptRefresh(req, res);

      const { userId, userRole } = decodeJWT(accessToken);

      req.userId = userId;
      req.userRole = userRole;
      return next();

    } catch (refreshErr) {
      return next(refreshErr);
    }
  }
}