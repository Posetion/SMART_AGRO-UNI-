import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

const FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  category: 'Category',
  description: 'Description',
  content: 'Content',
  fileUrl: 'File / download link',
  author: 'Author',
  tags: 'Tags',
  isPublished: 'Published',
  changeNote: 'Change note',
  q: 'Search',
};

function formatZodMessage(err: ZodError) {
  const flat = err.flatten();
  const parts: string[] = [...flat.formErrors];
  for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
    if (!msgs?.length) continue;
    const label = FIELD_LABELS[key] || key;
    parts.push(`${label}: ${msgs.join(', ')}`);
  }
  return parts.length ? parts.join(' · ') : 'Validation failed';
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: formatZodMessage(err),
      details: err.flatten(),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof multer.MulterError) {
    const tooBig = err.code === 'LIMIT_FILE_SIZE';
    return res.status(tooBig ? 413 : 400).json({
      success: false,
      message: tooBig ? 'File is too large' : err.message,
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid id',
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
