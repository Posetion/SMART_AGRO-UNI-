import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as detectionService from '../services/detection.service.js';
import { AppError } from '../utils/AppError.js';

function parseCoord(value: unknown, min: number, max: number) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return undefined;
  return n;
}

export const analyze = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('Image file required', 400);
  const data = await detectionService.analyzeImage({
    userId: req.user!.id,
    buffer: req.file.buffer,
    mimeType: req.file.mimetype,
    filename: req.file.originalname || 'leaf.jpg',
    lng: parseCoord(req.body.lng, -180, 180),
    lat: parseCoord(req.body.lat, -90, 90),
    township: req.body.township,
  });
  res.status(201).json({ success: true, data });
});

export const predict = asyncHandler(async (req: Request, res: Response) => {
  const data = await detectionService.predict(req.body);
  res.json({ success: true, data });
});

export const history = asyncHandler(async (req: Request, res: Response) => {
  const data = await detectionService.history(req.user!.id);
  res.json({ success: true, data });
});

export const reviewList = asyncHandler(async (req: Request, res: Response) => {
  const data = await detectionService.listForReview({
    verified: req.query.verified as string | undefined,
    status: req.query.status as string | undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.json({ success: true, data });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await detectionService.getDiagnosis(req.params.id, req.user!);
  res.json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await detectionService.updateDiagnosis(req.params.id, req.body, req.user!.id);
  res.json({ success: true, data });
});

export const verify = asyncHandler(async (req: Request, res: Response) => {
  const data = await detectionService.verifyDiagnosis(req.params.id, req.user!.id, req.body);
  res.json({ success: true, data });
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const data = await detectionService.rejectDiagnosis(
    req.params.id,
    req.user!.id,
    String(req.body.reason || '')
  );
  res.json({ success: true, data });
});

export const requestReapproval = asyncHandler(async (req: Request, res: Response) => {
  const data = await detectionService.requestReapproval(
    req.params.id,
    req.user!.id,
    String(req.body.message || '')
  );
  res.json({ success: true, data });
});

export const requestExpertReview = asyncHandler(async (req: Request, res: Response) => {
  const data = await detectionService.requestExpertReview(req.params.id, req.user!.id);
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const data = await detectionService.deleteDiagnosis(req.params.id, req.user!);
  res.json({ success: true, data });
});
