import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const skipInTest = () => env.NODE_ENV === 'test';

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.RATE_LIMIT_MAX_PER_MINUTE,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => env.NODE_ENV === 'test' || !String(req.path || '').startsWith('/api'),
  message: { success: false, message: 'Too many requests, please try again later' },
});

export const otpRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { success: false, message: 'Too many OTP requests, please wait' },
});

export const guestRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { success: false, message: 'Too many guest sessions, please wait' },
});

export const fileRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { success: false, message: 'Too many file requests, please wait' },
});
