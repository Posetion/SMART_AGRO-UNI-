import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as heatmapService from '../services/heatmap.service.js';

export const data = asyncHandler(async (_req: Request, res: Response) => {
  const result = await heatmapService.getHeatmapData();
  res.json({ success: true, data: result });
});

export const township = asyncHandler(async (_req: Request, res: Response) => {
  const result = await heatmapService.getTownshipBoundaries();
  res.json({ success: true, data: result });
});

export const filter = asyncHandler(async (req: Request, res: Response) => {
  const result = await heatmapService.filterHeatmap(req.body);
  res.json({ success: true, data: result });
});

export const statistics = asyncHandler(async (_req: Request, res: Response) => {
  const result = await heatmapService.getStatistics();
  res.json({ success: true, data: result });
});
