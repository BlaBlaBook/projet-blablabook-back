import type { NextFunction, Response, Request } from "express";
import type { Role } from "../models/index.ts";
import { decodeJWT, extractAccessTokenFromRequest } from "../lib/tokens.ts";
import { ForbiddenError } from "../lib/errors.ts";

// Ce middleware est STATELESS (comme le JWT) => on n'appelle pas la BDD : le rôle est stocké dans le JWT lui même !
export function allowRoles(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Extraire l'access token depuis "req" pour tirer le JWT
    const accessToken = extractAccessTokenFromRequest(req);

    // Valider (signature + date expiration) et decoder le JWT 
    const { userId, userRole } = decodeJWT(accessToken);
    
    // Vérifier si l'utilisateur a l'un des rôles demandés pour accéder à la route
    if (! roles.includes(userRole)) {
      throw new ForbiddenError(`Access denied for role: ${userRole}`);
    }

    // En général, on accroche également à la request (req) les infos utiles du JWT décodé
    // De sorte à ce que tous les middlewares suivants, puisse accéder facilement à l'utilisateur et son role
    req.userId = userId;
    req.userRole = userRole;

    // Sinon, on laisse passer
    next();
  };
}
