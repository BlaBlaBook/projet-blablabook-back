import argon2 from "argon2";
import z from "zod";
import type { Request, Response } from "express";
import { passwordValidationSchema } from "./utils.ts";
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from "../lib/error.ts";

export async function registerUser(req: Request, res: Response) {
  // Ecrire un schema Zod pour representer et valider le body
  const registerUserBodySchema = z.object({
    firstname: z.string().min(1),
    lastname: z.string().min(1),
    email: z.email(),
    password: passwordValidationSchema
  });
  
  // Récupérer les info du body de la requête et les valider
  const { firstname, lastname, email, password } = await registerUserBodySchema.parseAsync(req.body);

  // Vérifier si l'utilisateur n'existe pas déjà
  // Si le mail est déja pris => 409
  const alreadyExistingUser = await prisma.user.findFirst({ where: { email } });
  if (alreadyExistingUser) { throw new ConflictError("Email already taken"); }

  // Hacher le mot de passe à l'aide de argon2
  // Note : pendant le cours, NPM était down, utilisons plutôt scrypt (de node:crypto, natif à node !)
  const hashedPassword = await argon2.hash(password);

  // Enregistrer l'utilisateur en BDD
  const createdUser = await prisma.user.create({ data: {
    firstname,
    lastname,
    email,
    password: hashedPassword
  } });

  // Répondre en renvoyant un status 201 + user créé (sans son mot de passe)
  res.status(201).json({
    id: createdUser.id,
    firstname: createdUser.firstname,
    lastname: createdUser.lastname,
    email: createdUser.email,
    created_at: createdUser.created_at,
    updated_at: createdUser.updated_at
  });
}

export async function loginUser(req: Request, res: Response) {
  // Schéma de validation pour le login (email, password)
  const loginBodySchema = z.object({
    email: z.email(),
    password: z.string() // cette validation suffit ici car on va de toute manière comparer les hash ensuite
  });

  // Récupérer l'email et le mot de passe depuis le body, et on les valide
  const { email, password } = await loginBodySchema.parseAsync(req.body);

  // Récupérer l'utilisateur correspondant dans la BDD (via son email)
  const user = await prisma.user.findUnique({ where: { email } });
  // Si non présent => 400 / 401 / 404 (même combat)
  if (!user) { throw new BadRequestError("L'email et le mot de passe ne correspondent pas"); } // Réponse opaque pour ne pas faire fuiter trop d'information sur nos utilisateurs dans notre BDD

  // Vérifier si le mot de passe haché (bdd) correspond à celui envoyé (body)
  const isMatching = await argon2.verify(user.password, password);
  // Si match pas => 401 (Unauthorized)
  if (!isMatching) { throw new BadRequestError("L'email et le mot de passe ne correspondent pas"); } // Idem ici

  // Générer le JWT
  const accessToken = generateAccessToken(user);

  // Générer le refresh token
  const refreshToken = await generateRefreshToken(user);

  // Envoyer les tokens dans des cookies
  setTokensInCookies(res, accessToken, refreshToken);
  
  // Renvoyer l'access token (JWT) + refresh token (opaque) dans le body
  res.json({ accessToken, refreshToken });
}

export async function refreshAccessToken(req: Request, res: Response) {
  // Objectif :
  // - récupérer le refresh token depuis le body (ou le cookie associé)
  // - vérifier qu'il est valide (ie, dans la BDD, avec une date d'expiration non passée)
  // - générer un nouvel accessToken (JWT) et un nouveau refresh token (opaque)

  // Récupérer le token depuis req
  const rawToken = req.body.refreshToken || req.cookies.refreshToken;

  // Valider le token reçu pour s'assurer qu'il s'agisse d'une string
  const token = await z.string().parseAsync(rawToken); // Renvoie une 422 si le refresh token n'est pas fourni via notre global-error-handler

  // On cherche le token en BDD
  const refreshToken = await prisma.refreshToken.findFirst({ where: { token }, include: { user: true } });

  // Si on ne trouve pas le token en BDD ==> 401
  if (!refreshToken) { throw new UnauthorizedError("Invalid refresh token"); }

  // Si le token trouvé en BDD est expiré ==> 401
  if (refreshToken.expires_at < new Date()) { throw new UnauthorizedError("Expired refresh token"); }

  // Générer le JWT
  const accessToken = generateAccessToken(refreshToken.user);

  // Générer le refresh token
  const newRefreshToken = await generateRefreshToken(refreshToken.user);

  // Envoyer les tokens dans des cookies
  setTokensInCookies(res, accessToken, newRefreshToken);
  
  // Renvoyer l'access token (JWT) + refresh token (opaque) dans le body
  res.json({ accessToken, refreshToken: newRefreshToken });
  
}

export async function getCurrentUser(req: Request, res: Response) {
  // Récupérer le userId depuis "req" puisque on est passé par le allowRoles middleware juste avant
  const userId = req.userId;

  // Récupérer le user en BDD
  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: { password: true }
  });
  
  // Si pas de User : 401
  if (! user) {
    throw new NotFoundError("No user associated with this access token");
  }

  // Renvoyer le user
  res.json(user);
}

export async function logoutUser(req: Request, res: Response) {
  // Pour déconnecter l'utilisateur, il suffit de RETIRER l'accessToken + refreshToken côté client
  // En gros, si l'utilisateur perd sa clé, il est deconnecté
  // ==> Ca depend comment on a stocké les tokens côté client.
  // -> si localStorage, rien à faire côté backend, c'est côté front qu'on fera : localStorage.deleteItem("token")
  // -> si cookie, le backend peut renvoyer un autre cookie pour écraser celui existant

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(204).end(); // On termine la requête par une réponse
}

function setTokensInCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("accessToken", accessToken, {
    httpOnly: true, // empêche la lecture/manipulation du cookie par du code JS front
    maxAge: ACCESS_TOKEN_DURATION_IN_MS, // 1H - durée de vie du cookie, ensuite il se supprime automatiquement du navigateur de l'utilisateur
  });
  res.cookie("refreshToken", refreshToken, {
    path: "/api/auth/refresh", // les cookies s'envoient automatiquement du client vers le server qui les a généré. Avec l'option path, on choisit les routes exactes pour lesquel le cookie sera envoyé ==> autrement dit ici, notre refresh token ne s'envoie que sur la route /api/refresh (ça tombe bien car c'est la seule route où on a besoin de lui)
    httpOnly: true,
    maxAge: REFRESH_TOKEN_DURATION_IN_MS // 7J
  });
}
