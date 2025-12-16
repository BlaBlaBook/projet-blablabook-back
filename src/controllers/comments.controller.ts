import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";
import { NotFoundError, UnauthorizedError, BadRequestError } from "../lib/error.ts";

// -----------------------------------
// --- GET /api/comments/:bookId -----
// -----------------------------------
export async function getCommentsByBook(req: Request, res: Response) {
  const { bookId } = req.params;

  // Check if book exists
  const bookExists = await prisma.books.findUnique({ where: { id: bookId } });
  if (!bookExists) {
    throw new NotFoundError("Book not found");
  }

  // Fetch root comments with user, likes AND the user's rating for this book
  const rootComments = await prisma.comments.findMany({
    where: { book_id: bookId, parent_id: null },
    orderBy: { created_at: "desc" },
    include: {
      user: { 
        select: { 
          id: true, 
          username: true,
          // Also get this user's rating for this book
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

  // Function to transform to frontend format with likesCount, userRating and recursion
  function formatComment(comment: any): any {
    // Get user's rating (first element of bookRecords array)
    const userRating = comment.user.bookRecords[0]?.rating ?? null;

    return {
      id: comment.id,
      content: comment.content,
      user: {
        id: comment.user.id,
        username: comment.user.username
      },
      userRating: userRating,  // The rating of the comment author
      likesCount: comment.likes.length,
      replies: comment.replies?.map(formatComment) || [],
    };
  }

  const formattedComments = rootComments.map(formatComment);

  res.json({
    comments: formattedComments,
  });
}

// -----------------------------------
// ----- POST /api/comments/:bookId --
// -----------------------------------
export async function addComment(req: Request, res: Response) {
  const { bookId } = req.params;
  const { content, parent_id } = req.body;
  const userId = req.userId;

  // Check if user is authenticated
  if (!userId) {
    throw new UnauthorizedError("User not authenticated");
  }

  // Validate content
  if (!content || content.trim() === "") {
    throw new BadRequestError("Content is required");
  }

  // Check if book exists
  const bookExists = await prisma.books.findUnique({ where: { id: bookId } });
  if (!bookExists) {
    throw new NotFoundError("Book not found");
  }

  // Check if parent comment exists if provided
  let parentConnect = undefined;
  if (parent_id) {
    const parentComment = await prisma.comments.findUnique({ where: { id: parent_id } });
    if (!parentComment) {
      throw new NotFoundError("Parent comment not found");
    }
    parentConnect = { connect: { id: parent_id } };
  }

  // Create the comment
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

  // Format for frontend
  const formattedComment = {
    id: newComment.id,
    content: newComment.content,
    user: newComment.user,
    likesCount: newComment.likes.length,
    replies: [],
  };

  res.status(201).json(formattedComment);
}

// -----------------------------------
// -- PATCH /api/comments/:id/like ---
// -----------------------------------
export async function toggleCommentLike(req: Request, res: Response) {
  const { commentId } = req.params;
  const userId = req.userId;

  // Check if user is authenticated
  if (!userId) {
    throw new UnauthorizedError("User not authenticated");
  }

  // Check if comment exists
  const comment = await prisma.comments.findUnique({ where: { id: commentId } });
  if (!comment) {
    throw new NotFoundError("Comment not found");
  }

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
}
