import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().min(1),
  diagnosticId: z.string().optional(),
  images: z
    .array(
      z
        .string()
        .trim()
        .refine(
          (v) => v.startsWith('/api/v1/files/') || z.string().url().safeParse(v).success,
          'Image URL must be a stored file or http(s) link'
        )
    )
    .optional(),
});

export const updatePostSchema = z.object({
  content: z.string().min(1),
});

export const commentSchema = z.object({
  content: z.string().min(1),
});

export const moderateSchema = z.object({
  action: z.enum(['hide', 'restore', 'remove']),
  reason: z.string().optional(),
});

export const reportPostSchema = z.object({
  reason: z.string().trim().min(3, 'Please give a reason').max(500),
});

export const reviewReportSchema = z.object({
  action: z.enum(['approve', 'deny']),
  reason: z.string().trim().max(500).optional(),
});
