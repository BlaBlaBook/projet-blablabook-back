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