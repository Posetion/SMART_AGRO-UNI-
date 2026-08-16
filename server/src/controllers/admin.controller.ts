import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as adminService from '../services/admin.service.js';
import type { Role } from '../config/constants.js';

export const users = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.listUsers();
  res.json({ success: true, data });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.updateUserRole(
    req.params.id,
    req.body.role as Role,
    req.user!.id,
    req.ip
  );
  res.json({ success: true, data });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.deleteUserAccount(req.params.id, req.user!.id, req.ip);
  res.json({ success: true, data });
});

export const setUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.adminSetUserPassword(
    req.params.id,
    req.body.password,
    req.user!.id,
    req.ip
  );
  res.json({ success: true, data });
});

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.dashboardStats();
  res.json({ success: true, data });
});

export const auditLogs = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.listAuditLogs();
  res.json({ success: true, data });
});

export const backup = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.triggerBackup();
  res.json({ success: true, data });
});
