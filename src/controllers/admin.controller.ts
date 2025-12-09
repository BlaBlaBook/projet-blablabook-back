import { NotFoundError } from "../lib/error.ts";
import { prisma } from "../models/index.ts";
import type { Request, Response, NextFunction } from "express";

export async function getAllUsers(req: Request, res: Response, next: NextFunction) {
  try { 
    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function deleteUserById(req: Request, res: Response, next: NextFunction) {
  const userId = req.params.userId;
  try {
    const existingUser = await prisma.users.findUnique({ where: { id: userId }, });

    if (!existingUser) {
       throw new NotFoundError("User not found");
    }
    await prisma.users.delete({ where: { id: userId }, });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}