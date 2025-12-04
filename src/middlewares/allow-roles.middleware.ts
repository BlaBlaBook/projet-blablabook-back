import type { NextFunction, Response, Request } from "express";
import type { user_role } from "../models/index.ts";
import { decodeJWT, extractAccessTokenFromRequest } from "../lib/token.ts";
import { ForbiddenError } from "../lib/error.ts";

export function allowRoles(roles: user_role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get the access token from the request
    const accessToken = extractAccessTokenFromRequest(req);

    // Validate and decode the JWT
    const { userId, userRole } = decodeJWT(accessToken);
    
    // Check if the user has the required role
    if (! roles.includes(userRole)) {
      throw new ForbiddenError(`Access denied for role: ${userRole}`);
    }

    // Attach user info to the request
    req.userId = userId;
    req.userRole = userRole;

    // Continue to the next middleware
    next();
  };
}
