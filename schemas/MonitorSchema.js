import { z } from "zod";

const folderEntrySchema = z.object({
  seriesId: z.string().min(1, "Series ID is required"),
  isPremium: z.boolean().optional(),
  price: z.number().min(0, "Price must be a positive number").optional(),
  addedAt: z.date()
});

const processedFileEntrySchema = z.object({
  processedAt: z.date(),
  seriesId: z.string().min(1, "Series ID is required"),
  chapterId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid chapter ID"),
  name: z.string().min(1, "File name is required"),
  type: z.string().min(1, "File type is required")
});

export const monitorSchema = z.object({
  folders: z.record(z.string(), folderEntrySchema).default({}),
  processedFiles: z.record(z.string(), processedFileEntrySchema).default({}),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});