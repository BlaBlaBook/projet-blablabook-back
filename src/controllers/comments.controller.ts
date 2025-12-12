import type { Request, Response, NextFunction } from "express";
import { prisma } from "../models/index.ts";

export async function getCommentsByBook(req: Request, res: Response, next: NextFunction) {
  const { bookId } = req.params;

  try {
    // Vérifie que le livre existe
    const bookExists = await prisma.books.findUnique({ where: { id: bookId } });
    if (!bookExists) return res.status(404).json({ error: "Livre introuvable" });

    // Récupère les commentaires racine avec utilisateur, likes ET la note de l'utilisateur
    const rootComments = await prisma.comments.findMany({
      where: { book_id: bookId, parent_id: null },
      orderBy: { created_at: "desc" },
      include: {
        user: { 
          select: { 
            id: true, 
            username: true,
            // On récupère aussi la note de cet utilisateur pour ce livre
            bookRecords: {
              where: { book_id: bookId },
              select: { rating: true }
            }
          } 
        },
        likes: true,
        replies: {
          include: {
            user: { 
              select: { 
                id: true, 
                username: true,
                bookRecords: {
                  where: { book_id: bookId },
                  select: { rating: true }
                }
              } 
            },
            likes: true,
            replies: {
              include: {
                user: { 
                  select: { 
                    id: true, 
                    username: true,
                    bookRecords: {
                      where: { book_id: bookId },
                      select: { rating: true }
                    }
                  } 
                },
                likes: true,
              }
            },
          },
        },
      },
    });

    // Fonction pour transformer en format frontend avec likesCount, userRating et récursion
    function formatComment(comment: any): any {
      // Récupère la note de l'utilisateur (le premier élément du tableau bookRecords)
      const userRating = comment.user.bookRecords[0]?.rating ?? null;

      return {
        id: comment.id,
        content: comment.content,
        user: {
          id: comment.user.id,
          username: comment.user.username
        },
        userRating: userRating,  // La note de l'auteur du commentaire
        likesCount: comment.likes.length,
        replies: comment.replies?.map(formatComment) || [],
      };
    }

    const formattedComments = rootComments.map(formatComment);

    res.json({
      comments: formattedComments,
    });
  } catch (error) {
    console.error("Error in getCommentsByBook:", error);
    next(error);
  }
}

export async function addComment(req: Request, res: Response, next: NextFunction) {
  const { bookId } = req.params;
  const { content, parent_id } = req.body;
  const userId = req.userId;

  try {
    if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });
    if (!content || content.trim() === "") return res.status(400).json({ error: "Le contenu est requis" });

    // Vérifie que le livre existe
    const bookExists = await prisma.books.findUnique({ where: { id: bookId } });
    if (!bookExists) return res.status(404).json({ error: "Livre introuvable" });

    // Vérifie que parent existe si fourni
    let parentConnect = undefined;
    if (parent_id) {
      const parentComment = await prisma.comments.findUnique({ where: { id: parent_id } });
      if (!parentComment) return res.status(404).json({ error: "Commentaire parent introuvable" });
      parentConnect = { connect: { id: parent_id } };
    }

    // Crée le commentaire
    const newComment = await prisma.comments.create({
      data: {
        content,
        user: { connect: { id: userId } },
        book: { connect: { id: bookId } },
        parent: parentConnect,
      },
      include: {
        user: { select: { id: true, username: true } },
        likes: true,
        replies: true,
      },
    });

    // Format pour le frontend
    const formattedComment = {
      id: newComment.id,
      content: newComment.content,
      user: newComment.user,
      likesCount: newComment.likes.length,
      replies: [],
    };

    res.status(201).json(formattedComment);
  } catch (error) {
    console.error("Error in addComment:", error);
    next(error);
  }
}

export async function toggleCommentLike(req: Request, res: Response, next: NextFunction) {
  const { commentId } = req.params;
  const userId = req.userId;

  if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

  try {
    // Vérifie que le commentaire existe
    const comment = await prisma.comments.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: "Commentaire introuvable" });

    // Toggle like
    const existingLike = await prisma.commentLikes.findUnique({
      where: { user_id_comment_id: { user_id: userId, comment_id: commentId } },
    });

    if (existingLike) {
      await prisma.commentLikes.delete({ where: { id: existingLike.id } });
      return res.json({ liked: false });
    } else {
      await prisma.commentLikes.create({
        data: { user_id: userId, comment_id: commentId },
      });
      return res.json({ liked: true });
    }
  } catch (error) {
    console.error("Error in toggleCommentLike:", error);
    next(error);
  }
}
