import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";

export const getUserStats = async (req: Request, res: Response) => {
  const userId = req.userId;

  try {
    // Fetch only comments for the user
    const comments = await prisma.comments.findMany({
      where: { user_id: userId },
      select: { id: true, parent_id: true },
    });

    // Separate comments and replies
    const commentsCount = comments.filter(c => !c.parent_id).length;
    const repliesCount = comments.filter(c => c.parent_id).length;

    res.json({ commentsCount, repliesCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
