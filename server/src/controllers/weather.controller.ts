import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as weatherService from '../services/weather.service.js';

export const forecast = asyncHandler(async (req: Request, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const data = await weatherService.getForecast(lat, lng);
  res.json({ success: true, data });
});

export const current = asyncHandler(async (req: Request, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const data = await weatherService.getCurrent(lat, lng);
  res.json({ success: true, data });
});

export const alerts = asyncHandler(async (req: Request, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const data = await weatherService.getAlerts(lat, lng);
  res.json({ success: true, data });
});

export const recommendations = asyncHandler(async (req: Request, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const data = await weatherService.getRecommendations(lat, lng);
  res.json({ success: true, data });
});

export const townships = asyncHandler(async (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const data = await weatherService.listTownships(search);
  res.json({ success: true, data });
});

export const byCoords = asyncHandler(async (req: Request, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const name = typeof req.query.name === 'string' ? req.query.name : undefined;
  const region = typeof req.query.region === 'string' ? req.query.region : undefined;
  const data = await weatherService.getByCoords(lat, lng, name, region);
  res.json({ success: true, data });
});

export const byTownship = asyncHandler(async (req: Request, res: Response) => {
  const data = await weatherService.getByTownship(req.params.township);
  res.json({ success: true, data });
});
