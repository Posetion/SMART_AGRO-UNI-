import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { Role } from '../config/constants.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { AppError } from '../utils/AppError.js';

export interface AccessPayload {
  sub: string;
  email: string;
  role: Role;
}

function parseDurationMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(match[1]);
  const unit = match[2];
  const mult = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return n * mult;
}

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRE as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
  } catch {
    throw new AppError('Invalid or expired access token', 401);
  }
}

export async function issueRefreshToken(
  userId: string,
  meta: { userAgent?: string; ip?: string } = {}
): Promise<string> {
  const raw = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRE));

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
    userAgent: meta.userAgent ?? '',
    ip: meta.ip ?? '',
  });

  return raw;
}

export async function rotateRefreshToken(
  rawToken: string,
  meta: { userAgent?: string; ip?: string } = {}
): Promise<{ userId: string; refreshToken: string }> {
  const tokenHash = hashToken(rawToken);
  const matched = await RefreshToken.findOne({
    tokenHash,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });

  if (!matched) {
    throw new AppError('Invalid refresh token', 401);
  }

  matched.revokedAt = new Date();
  await matched.save();

  const refreshToken = await issueRefreshToken(String(matched.userId), meta);
  return { userId: String(matched.userId), refreshToken };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await RefreshToken.updateOne(
    { tokenHash, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
}
