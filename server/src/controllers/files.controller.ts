import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { openDownloadStream } from '../services/storage.service.js';

export const getFile = asyncHandler(async (req: Request, res: Response) => {
  const stream = await openDownloadStream(req.params.id);
  stream.on('file', (file) => {
    if (file.contentType) res.setHeader('Content-Type', file.contentType);
  });
  stream.on('error', () => {
    if (!res.headersSent) {
      res.status(404).json({ success: false, message: 'File not found' });
    }
  });
  stream.pipe(res);
});
