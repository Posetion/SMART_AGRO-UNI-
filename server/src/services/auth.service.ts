import crypto from 'crypto';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { assertPasswordStrength, hashPassword, verifyPassword } from '../utils/password.js';
import { issueRefreshToken, signAccessToken } from './token.service.js';
import { writeAuditLog } from './audit.service.js';
import type { Role } from '../config/constants.js';

type SessionMeta = { userAgent?: string; ip?: string };

function toSessionUser(user: {
  _id: { toString(): string };
  email: string;
  fullName?: string | null;
  role: string;
  isGuest?: boolean | null;
  location?: unknown;
}) {
  return {
    id: String(user._id),
    email: user.email,
    fullName: user.fullName || '',
    role: user.role,
    isGuest: Boolean(user.isGuest),
    location: user.location,
  };
}

async function issueTokensForUser(
  user: {
    _id: { toString(): string };
    email: string;
    fullName?: string | null;
    role: string;
    isGuest?: boolean | null;
    isActive?: boolean | null;
    location?: unknown;
  },
  meta: SessionMeta,
  auditAction: string
) {
  if (!user.isActive) {
    throw new AppError('Account is disabled', 403);
  }

  const accessToken = signAccessToken({
    sub: String(user._id),
    email: user.email,
    role: user.role as Role,
  });
  const refreshToken = await issueRefreshToken(String(user._id), meta);

  await writeAuditLog({
    actorId: user._id as never,
    action: auditAction,
    resourceType: 'User',
    resourceId: user._id as never,
    ip: meta.ip,
  });

  return {
    accessToken,
    refreshToken,
    user: toSessionUser(user),
  };
}

export async function registerWithPassword(
  email: string,
  password: string,
  fullName = '',
  meta: SessionMeta = {}
) {
  const normalized = email.toLowerCase().trim();
  if (!normalized) throw new AppError('Email is required', 400);

  try {
    assertPasswordStrength(password);
  } catch (err) {
    throw new AppError(err instanceof Error ? err.message : 'Invalid password', 400);
  }

  const passwordHash = await hashPassword(password);
  const existing = await User.findOne({ email: normalized }).select('+passwordHash');

  if (existing) {
    if (existing.isGuest) {
      throw new AppError('Guest accounts cannot be registered. Use a real email.', 400);
    }
    if (existing.passwordHash) {
      throw new AppError('An account with this email already exists. Please log in.', 409);
    }
    // Legacy OTP-era account: set password and sign in
    existing.passwordHash = passwordHash;
    existing.isVerified = true;
    if (fullName.trim()) existing.fullName = fullName.trim();
    await existing.save();
    return issueTokensForUser(existing, meta, 'AUTH_REGISTER');
  }

  const user = await User.create({
    email: normalized,
    passwordHash,
    fullName: fullName.trim(),
    role: 'farmer' as Role,
    isVerified: true,
    isActive: true,
  });

  return issueTokensForUser(user, meta, 'AUTH_REGISTER');
}

export async function loginWithPassword(email: string, password: string, meta: SessionMeta = {}) {
  const normalized = email.toLowerCase().trim();
  if (!normalized || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await User.findOne({ email: normalized }).select('+passwordHash');
  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email or password', 401);
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    throw new AppError('Invalid email or password', 401);
  }

  user.isVerified = true;
  await user.save();

  return issueTokensForUser(user, meta, 'AUTH_LOGIN');
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new AppError('User not found', 404);
  if (user.isGuest) {
    throw new AppError('Guest accounts cannot set a password. Please register.', 400);
  }

  try {
    assertPasswordStrength(newPassword);
  } catch (err) {
    throw new AppError(err instanceof Error ? err.message : 'Invalid password', 400);
  }

  if (user.passwordHash) {
    if (!currentPassword) {
      throw new AppError('Current password is required', 400);
    }
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) {
      throw new AppError('Current password is incorrect', 400);
    }
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    throw new AppError('New password must be different from the current password', 400);
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  await writeAuditLog({
    actorId: user._id,
    action: 'AUTH_PASSWORD_CHANGE',
    resourceType: 'User',
    resourceId: user._id,
  });

  return { message: 'Password updated' };
}

/** Create a temporary farmer session without email/password. */
export async function loginAsGuest(meta: SessionMeta = {}) {
  const guestId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const email = `guest-${guestId}@guest.smartagro.local`;

  const user = await User.create({
    email,
    fullName: 'Guest Farmer',
    role: 'farmer' as Role,
    isVerified: true,
    isActive: true,
    isGuest: true,
    crops: ['Rice'],
    location: {
      township: '',
      region: '',
      coordinates: { type: 'Point', coordinates: [0, 0] },
    },
  });

  return issueTokensForUser(user, meta, 'AUTH_GUEST_LOGIN');
}
