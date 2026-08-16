import type { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog.js';

export async function writeAuditLog(input: {
  actorId?: string | Types.ObjectId;
  action: string;
  resourceType?: string;
  resourceId?: string | Types.ObjectId;
  metadata?: Record<string, unknown>;
  ip?: string;
}) {
  await AuditLog.create({
    actorId: input.actorId,
    action: input.action,
    resourceType: input.resourceType ?? '',
    resourceId: input.resourceId,
    metadata: input.metadata,
    ip: input.ip ?? '',
  });
}
