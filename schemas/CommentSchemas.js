import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1, "Content is required"),
  userId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID"),
  chapterId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid chapter ID"),
});

export const updateCommentSchema = z.object({
  content: z.string().optional(),
  likes: z.number().min(0).optional(),
  dislikes: z.number().min(0).optional(),
});
