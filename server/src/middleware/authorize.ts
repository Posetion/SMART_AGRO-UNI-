import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../config/constants.js';
import { AppError } from '../utils/AppError.js';

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403));
    }
    return next();
  };
}

export function authorizeExpertPlus(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  if (req.user.role !== 'expert' && req.user.role !== 'admin') {
    return next(new AppError('Forbidden', 403));
  }
  return next();
}
