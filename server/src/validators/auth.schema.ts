import { z } from 'zod';
import { CROP_TYPES } from '../config/diseases.js';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');

export const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  fullName: z.string().max(120).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required').max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().max(128).optional().default(''),
  newPassword: passwordSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(20),
});

export const updateMeSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  phoneNumber: z.string().max(40).optional(),
  township: z.string().max(80).optional(),
  region: z.string().max(80).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  bio: z.string().max(400).optional(),
  crops: z.array(z.enum(CROP_TYPES)).max(CROP_TYPES.length).optional(),
  avatarTone: z.enum(['mint', 'sky', 'coral', 'amber', 'peach', 'teal']).optional(),
});

/** @deprecated OTP auth removed — kept only if any old client still imports */
export const requestOtpSchema = z.object({
  email: z.string().email(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/),
});
