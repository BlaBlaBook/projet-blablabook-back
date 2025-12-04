import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import type { JwtPayload } from "jsonwebtoken";
import type { Request } from "express";
import { config } from "../../config.ts";
import { prisma, type users } from "../models/index.ts";
import { UnauthorizedError } from "./error.ts";

export const ACCESS_TOKEN_DURATION_IN_MS = 1 * 60 * 60 * 1000; // 1h
export const REFRESH_TOKEN_DURATION_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7j

export function decodeJWT(accessToken: string): JwtPayload {
  try {
    // Vérifier la validité du JWT
    // - est-ce qu'il est bien signé ?
    // - est-ce qu'il n'est pas périmé ?
    // - décoder pour récupérer le payload ==> userId
    const payload = jwt.verify(accessToken, config.jwtSecret) as JwtPayload; // Type assertion
    return payload;

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Provided access token is expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("Provided access token is malformed");
    }
    
    console.error(error);
    throw new UnauthorizedError("JWT unknown error");
  }
}

export function generateAccessToken(user: users) {
  // Générer un JWT
  // - payload : userId
  // - signé : JWT_SECRET (config)
  // - durée de validité : 1h (optimal : 15min)
  const payload = { userId: user.id, userRole: user.role };
  const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: ACCESS_TOKEN_DURATION_IN_MS / 1000 }); // Access Token = JWT 
  return accessToken;
}

export async function generateRefreshToken(user: users) {
  // Refresh Token = Token opaque (64 caractères aléatoires)
  // - token opaque ? -> chaine de caractère aléatoire
  // - durée de validité : 7j
  const refreshToken = crypto.randomBytes(64).toString("base64");
  
  // Stocker le refresh token en BDD
  await prisma.refreshToken.deleteMany({ where: { user_id: user.id } }); // On supprime le refresh token qui existeraient potentiellement
  await prisma.refreshToken.create({ data: {
    user_id: user.id,
    token: refreshToken,
    expires_at: new Date(Date.now() + REFRESH_TOKEN_DURATION_IN_MS)
  }});

  return refreshToken;
}

export function extractAccessTokenFromRequest(req: Request) {
  // On essaie de chopper l'access token depuis le header authorization
  // Si il y est, on le renvoie !
  const authorizationHeader = req.headers.authorization;
  if (typeof authorizationHeader === "string") {
    return authorizationHeader.substring("Bearer ".length); // On ne garde que l'access token, sans le "Bearer " devant
  }

  // On essaie de chopper l'access token depuis le cookie "accessToken"
  // Si il y est, on le renvoie !
  const accessTokenCookie = req.cookies.accessToken;
  if (typeof accessTokenCookie === "string") {
    return accessTokenCookie;
  }

  // On renvoie une 401 --> throw UnauthorizedError
  throw new UnauthorizedError("Access token not provided in Authorization headers nor Cookies");
}