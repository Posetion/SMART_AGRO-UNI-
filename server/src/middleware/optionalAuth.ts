import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../services/token.service.js';
import type { Role } from '../config/constants.js';

/** Attach req.user when Bearer token present; never blocks guests. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role as Role,
    };
  } catch {
    // ignore invalid token for public routes
  }
  return next();
}
