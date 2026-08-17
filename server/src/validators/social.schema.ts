import { z } from 'zod';
import { MAX_POST_IMAGES } from '../config/constants.js';

const imageUrl = z
  .string()
  .trim()
  .refine(
    (v) => v.startsWith('/api/v1/files/') || z.string().url().safeParse(v).success,
    'Image URL must be a stored file or http(s) link'
  );

function parseKeepImages(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null || value === '') return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) return parsed;
      } catch {
        /* fall through */
      }
    }
    return [value];
  }
  return [];
}

export const createPostSchema = z.object({
  content: z.string().min(1),
  diagnosticId: z.string().optional(),
  images: z.array(imageUrl).optional(),
});

export const updatePostSchema = z.object({
  content: z.string().min(1),
  keepImages: z.preprocess(parseKeepImages, z.array(imageUrl).max(MAX_POST_IMAGES).optional()),
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
