import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as socialService from '../services/social.service.js';
import { MAX_POST_IMAGES } from '../config/constants.js';
import { uploadBuffer } from '../services/storage.service.js';
import { AppError } from '../utils/AppError.js';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const imageUrls: string[] = [];
  for (const file of files) {
    imageUrls.push(await uploadBuffer(file.buffer, file.originalname, file.mimetype));
  }

  const bodyImages = Array.isArray(req.body.images)
    ? req.body.images
    : req.body.images
      ? [req.body.images]
      : [];

  const data = await socialService.createPost({
    userId: req.user!.id,
    content: req.body.content,
    diagnosticId: req.body.diagnosticId,
    images: [...bodyImages, ...imageUrls],
  });
  res.status(201).json({ success: true, data });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const includeHidden = req.user?.role === 'admin' && req.query.hidden === 'true';
  const data = await socialService.listPosts(req.query, includeHidden);
  res.json({ success: true, data: data.items, meta: data.meta });
});

export const publicProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await socialService.getPublicProfile(req.params.id, req.user!.id);
  res.json({ success: true, data });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await socialService.getPost(req.params.id);
  res.json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const newImages: string[] = [];
  for (const file of files) {
    newImages.push(await uploadBuffer(file.buffer, file.originalname, file.mimetype));
  }

  const keepImages = req.body.keepImages as string[] | undefined;
  const keepCount = keepImages?.length ?? 0;
  if (keepCount + newImages.length > MAX_POST_IMAGES) {
    throw new AppError(`You can attach up to ${MAX_POST_IMAGES} photos`, 400);
  }

  const data = await socialService.updatePost(req.params.id, req.user!.id, {
    content: req.body.content,
    keepImages,
    newImages: newImages.length ? newImages : undefined,
  });
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const data = await socialService.deletePost(req.params.id, req.user!.id, req.user!.role);
  res.json({ success: true, data });
});

export const comment = asyncHandler(async (req: Request, res: Response) => {
  const data = await socialService.addComment(req.params.id, req.user!.id, req.body.content);
  res.status(201).json({ success: true, data });
});

export const reply = asyncHandler(async (req: Request, res: Response) => {
  const data = await socialService.addReply(
    req.params.id,
    req.params.commentId,
    req.user!.id,
    req.body.content
  );
  res.status(201).json({ success: true, data });
});

export const like = asyncHandler(async (req: Request, res: Response) => {
  const data = await socialService.toggleLike(req.params.id, req.user!.id);
  res.json({ success: true, data });
});

export const moderate = asyncHandler(async (req: Request, res: Response) => {
  if (!req.body.action) throw new AppError('action required', 400);
  const data = await socialService.moderatePost(
    req.params.id,
    req.user!.id,
    req.body.action,
    req.body.reason,
    req.ip
  );
  res.json({ success: true, data });
});

export const report = asyncHandler(async (req: Request, res: Response) => {
  const data = await socialService.reportPost(req.params.id, req.user!.id, req.body.reason);
  res.status(201).json({ success: true, data });
});

export const listReports = asyncHandler(async (req: Request, res: Response) => {
  const data = await socialService.listPostReports(req.query);
  res.json({ success: true, data: data.items, meta: data.meta });
});

export const reviewReport = asyncHandler(async (req: Request, res: Response) => {
  const data = await socialService.reviewPostReport(
    req.params.id,
    req.user!.id,
    req.body.action,
    req.body.reason,
    req.ip
  );
  res.json({ success: true, data });
});
