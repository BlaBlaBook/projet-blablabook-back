import type { NextFunction, Request, Response } from "express";
import { extractAccessTokenFromRequest, decodeJWT } from "../lib/token.ts";
import { attemptRefresh } from "../lib/auth.ts";
import { UnauthorizedError } from "../lib/error.ts";

export async function isAuth(req: Request, res: Response, next: NextFunction) {
	try {
		// Try access token
		const token = extractAccessTokenFromRequest(req);
		const { userId, userRole } = decodeJWT(token);

		req.userId = userId;
		req.userRole = userRole;
		return next();
	} catch (error) {
		// AccessToken expired → try refresh
		if (error instanceof UnauthorizedError) {
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
		return next(error);
	}
}
