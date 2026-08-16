import type { Request, Response } from 'express';
import {
  changePassword,
  loginAsGuest,
  loginWithPassword,
  registerWithPassword,
} from '../services/auth.service.js';
import {
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
} from '../services/token.service.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import type { Role } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerWithPassword(
    req.body.email,
    req.body.password,
    typeof req.body.fullName === 'string' ? req.body.fullName : '',
    {
      userAgent: req.get('user-agent') ?? '',
      ip: req.ip,
    }
  );
  res.status(201).json({ success: true, data: result });
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginWithPassword(req.body.email, req.body.password, {
    userAgent: req.get('user-agent') ?? '',
    ip: req.ip,
  });
  res.json({ success: true, data: result });
});

export const changePasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await changePassword(
    req.user!.id,
    typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '',
    req.body.newPassword
  );
  res.json({ success: true, data: result });
});

export const guestLoginHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginAsGuest({
    userAgent: req.get('user-agent') ?? '',
    ip: req.ip,
  });
  res.json({ success: true, data: result });
});

export const refreshTokenHandler = asyncHandler(async (req: Request, res: Response) => {
  const { userId, refreshToken } = await rotateRefreshToken(req.body.refreshToken, {
    userAgent: req.get('user-agent') ?? '',
    ip: req.ip,
  });

  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new AppError('User not found', 401);
  }

  const accessToken = signAccessToken({
    sub: String(user._id),
    email: user.email,
    role: user.role as Role,
  });

  res.json({
    success: true,
    data: { accessToken, refreshToken },
  });
});

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  await revokeRefreshToken(req.body.refreshToken);
  res.json({ success: true, data: { message: 'Logged out' } });
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id).select('-__v -passwordHash');
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: user });
});

export const updateMeHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError('User not found', 404);

  if (typeof req.body.fullName === 'string') user.fullName = req.body.fullName.trim();
  if (typeof req.body.phoneNumber === 'string') user.phoneNumber = req.body.phoneNumber.trim();
  if (typeof req.body.bio === 'string') user.bio = req.body.bio.trim();
  if (Array.isArray(req.body.crops)) user.crops = req.body.crops;
  if (typeof req.body.avatarTone === 'string') user.avatarTone = req.body.avatarTone;

  if (!user.location) {
    user.location = {
      township: '',
      region: '',
      coordinates: { type: 'Point', coordinates: [0, 0] },
    };
  }
  if (typeof req.body.township === 'string') user.location.township = req.body.township.trim();
  if (typeof req.body.region === 'string') user.location.region = req.body.region.trim();
  if (typeof req.body.lat === 'number' && typeof req.body.lng === 'number') {
    user.location.coordinates = {
      type: 'Point',
      coordinates: [req.body.lng, req.body.lat],
    };
  }

  await user.save();
  res.json({ success: true, data: user });
});

export const uploadAvatarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('Please choose a profile photo', 400);
  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError('User not found', 404);

  const { uploadBuffer } = await import('../services/storage.service.js');
  const safeName = req.file.originalname.replace(/[^\w.\-()+ ]+/g, '_').slice(0, 120);
  user.avatarUrl = await uploadBuffer(req.file.buffer, safeName || 'avatar.jpg', req.file.mimetype);
  await user.save();
  res.json({ success: true, data: user });
});

export const uploadCoverHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('Please choose a cover photo', 400);
  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError('User not found', 404);

  const { uploadBuffer } = await import('../services/storage.service.js');
  const safeName = req.file.originalname.replace(/[^\w.\-()+ ]+/g, '_').slice(0, 120);
  user.coverUrl = await uploadBuffer(req.file.buffer, safeName || 'cover.jpg', req.file.mimetype);
  await user.save();
  res.json({ success: true, data: user });
});
