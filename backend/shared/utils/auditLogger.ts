import { Request } from 'express';
import AuditLog from '../../modules/system/models/AuditLog.js';

export const writeAuditLog = async (
  req: Request,
  action: string,
  resourceType: string,
  resourceId: string,
  before?: Record<string, any>,
  after?: Record<string, any>
) => {
  try {
    if (!req.user) return;
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action,
      resourceType,
      resourceId,
      before,
      after,
    });
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err);
  }
};
