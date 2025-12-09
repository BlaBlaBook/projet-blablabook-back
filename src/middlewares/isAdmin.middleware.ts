import type { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../lib/error.ts";
import { extractAccessTokenFromRequest, decodeJWT } from "../lib/token.ts";

export async function isAdmin(req: Request, res: Response, next: NextFunction) {
    try {

      const accessToken = await extractAccessTokenFromRequest(req);

      const { userId, userRole } = await decodeJWT(accessToken);

      if (userRole!== "admin") {
        throw new ForbiddenError(`You must be admin to access this route`);
      }

      req.userId = userId;
      req.userRole = userRole;

      next();
    } catch (err) {
      next(err);
    }
  };