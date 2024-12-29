import { z } from "zod";
import {
  paymentTypeEnum,
  seriesTypeEnum,
  weekDaysEnum,
} from "../constants/index.js";

export const createSeriesSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  translator: z.string(),
  genres: z.array(z.string().min(1, "Each genre must be a non-empty string")),
  tags: z
    .array(z.string().min(1, "Each tag must be a non-empty string"))
    .optional(),
  thumbnail: z.string(),
  views: z.number().min(0, "Views cannot be negative").optional(),
  ratings: z.number().min(0, "Ratings cannot be negative").optional(),
  schedule: z.array(z.enum(weekDaysEnum)),
  type: z.enum(seriesTypeEnum),
  paymentType: z.enum(paymentTypeEnum, "Invalid payment type"),
  tiers: z.array(z.string()).optional(),
});

export const updateSeriesSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  translator: z.string().optional(),
  genres: z
    .array(z.string().min(1, "Each genre must be a non-empty string"))
    .optional(),
  tags: z
    .array(z.string().min(1, "Each tag must be a non-empty string"))
    .optional(),
  thumbnail: z.string().optional(),
  views: z.number().min(0, "Views cannot be negative").optional(),
  ratings: z.number().min(0, "Ratings cannot be negative").optional(),
  schedule: z.array(z.enum(weekDaysEnum)).optional(),
  type: z.string().optional(),
  paymentType: z.enum(paymentTypeEnum).optional(),
  tiers: z.array(z.string()).optional(),
});
