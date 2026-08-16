import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as chatbotService from '../services/chatbot.service.js';

export const message = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const data = await chatbotService.sendMessage(req.user!.id, req.body.text || '', {
    sessionId: req.body.sessionId,
    lat: req.body.lat,
    lng: req.body.lng,
    township: req.body.township,
    files,
  });
  res.json({ success: true, data });
});

export const history = asyncHandler(async (req: Request, res: Response) => {
  const data = await chatbotService.history(req.user!.id);
  res.json({ success: true, data });
});

export const createSession = asyncHandler(async (req: Request, res: Response) => {
  const data = await chatbotService.createSession(req.user!.id);
  res.status(201).json({ success: true, data });
});

export const getSession = asyncHandler(async (req: Request, res: Response) => {
  const data = await chatbotService.getSession(req.params.id, req.user!.id);
  res.json({ success: true, data });
});

export const deleteSession = asyncHandler(async (req: Request, res: Response) => {
  const data = await chatbotService.deleteSession(req.params.id, req.user!.id);
  res.json({ success: true, data });
});

export const clearHistory = asyncHandler(async (req: Request, res: Response) => {
  const data = await chatbotService.clearHistory(req.user!.id);
  res.json({ success: true, data });
});
