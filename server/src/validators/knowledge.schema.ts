import { z } from 'zod';
import { KNOWLEDGE_CATEGORIES } from '../config/constants.js';

/** External https URL or an uploaded GridFS path from /knowledge/upload */
const fileUrlField = z
  .string()
  .optional()
  .refine(
    (v) => {
      if (v == null || v === '') return true;
      if (v.startsWith('/api/v1/files/')) return true;
      return z.string().url().safeParse(v).success;
    },
    { message: 'Use a full link (https://...) or upload a file from your device' }
  );

export const createKnowledgeSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    category: z.enum(KNOWLEDGE_CATEGORIES, {
      errorMap: () => ({ message: 'Category must be Book, Article, or Journal' }),
    }),
    description: z.string().optional(),
    content: z.string().optional(),
    fileUrl: fileUrlField,
    coverUrl: fileUrlField,
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isPublished: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const needsFile = data.category === 'Book' || data.category === 'Journal';
    if (needsFile && !data.fileUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Upload a PDF/EPUB or paste a download link',
        path: ['fileUrl'],
      });
    }
  });

export const updateKnowledgeSchema = z
  .object({
    title: z.string().min(1, 'Title is required').optional(),
    category: z.enum(KNOWLEDGE_CATEGORIES).optional(),
    description: z.string().optional(),
    content: z.string().optional(),
    fileUrl: fileUrlField,
    coverUrl: fileUrlField,
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isPublished: z.boolean().optional(),
    changeNote: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.category === 'Book' || data.category === 'Journal') && data.fileUrl === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Upload a PDF/EPUB or paste a download link',
        path: ['fileUrl'],
      });
    }
  });

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  category: z.enum(KNOWLEDGE_CATEGORIES).optional(),
});
