import { z } from "zod";

export const chapterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  seriesId: z.string().min(1, "Series ID is required"),
  isPremium: z.boolean().optional(),
  price: z.number().min(0, "Price must be a positive number").optional(),
});
