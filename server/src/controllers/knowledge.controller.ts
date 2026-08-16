import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as knowledgeService from '../services/knowledge.service.js';
import type { KnowledgeCategory } from '../config/constants.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const includeDrafts = req.user?.role === 'admin' && req.query.drafts === 'true';
  const data = await knowledgeService.listArticles({
    page: req.query.page,
    limit: req.query.limit,
    category: req.query.category as string | undefined,
    includeDrafts,
  });
  res.json({ success: true, data: data.items, meta: data.meta });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const allowDraft = req.user?.role === 'admin';
  const data = await knowledgeService.getArticle(req.params.id, allowDraft);
  res.json({ success: true, data });
});

export const search = asyncHandler(async (req: Request, res: Response) => {
  const data = await knowledgeService.searchArticles(
    String(req.query.q),
    req.query.category as string | undefined
  );
  res.json({ success: true, data });
});

export const categories = asyncHandler(async (_req: Request, res: Response) => {
  const data = await knowledgeService.getCategories();
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await knowledgeService.createArticle({
    ...req.body,
    category: req.body.category as KnowledgeCategory,
    uploadedBy: req.user!.id,
  });
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { changeNote, ...updates } = req.body;
  const data = await knowledgeService.updateArticle(
    req.params.id,
    updates,
    req.user!.id,
    changeNote
  );
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await knowledgeService.deleteArticle(req.params.id);
  res.json({ success: true, data: { deleted: true } });
});

export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'Please choose a file to upload' });
    return;
  }

  const { uploadBuffer } = await import('../services/storage.service.js');
  const safeName = req.file.originalname.replace(/[^\w.\-()+ ]+/g, '_').slice(0, 120);
  const fileUrl = await uploadBuffer(req.file.buffer, safeName || 'book.pdf', req.file.mimetype);
  res.status(201).json({
    success: true,
    data: {
      fileUrl,
      filename: safeName,
      contentType: req.file.mimetype,
      size: req.file.size,
    },
  });
});

export const uploadCover = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'Please choose a cover image' });
    return;
  }

  const { uploadBuffer } = await import('../services/storage.service.js');
  const safeName = req.file.originalname.replace(/[^\w.\-()+ ]+/g, '_').slice(0, 120);
  const coverUrl = await uploadBuffer(req.file.buffer, safeName || 'cover.jpg', req.file.mimetype);
  res.status(201).json({
    success: true,
    data: {
      coverUrl,
      filename: safeName,
      contentType: req.file.mimetype,
      size: req.file.size,
    },
  });
});
