import { Request, Response } from 'express';
import * as notifService from '../services/notification.service.js';
import * as preferenceService from '../services/notification.preference.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import { AppError } from '../../../shared/utils/AppError.js';

const sanitizePreferencesPatch = (rawBody: unknown): preferenceService.NotificationPreferencesPatch => {
  if (!rawBody || typeof rawBody !== 'object') return {};
  const body = rawBody as Record<string, unknown>;
  const patch: preferenceService.NotificationPreferencesPatch = {};

  if (body.channels && typeof body.channels === 'object') {
    const channels = body.channels as Record<string, unknown>;
    patch.channels = {};
    if (channels.inAppEnabled !== undefined) {
      if (typeof channels.inAppEnabled !== 'boolean') throw new AppError('channels.inAppEnabled phải là boolean', 400);
      patch.channels.inAppEnabled = channels.inAppEnabled;
    }
    if (channels.emailEnabled !== undefined) {
      if (typeof channels.emailEnabled !== 'boolean') throw new AppError('channels.emailEnabled phải là boolean', 400);
      patch.channels.emailEnabled = channels.emailEnabled;
    }
    if (channels.pushEnabled !== undefined) {
      if (typeof channels.pushEnabled !== 'boolean') throw new AppError('channels.pushEnabled phải là boolean', 400);
      patch.channels.pushEnabled = channels.pushEnabled;
    }
  }

  if (body.ui && typeof body.ui === 'object') {
    const ui = body.ui as Record<string, unknown>;
    patch.ui = {};
    if (ui.sidebarAutoCollapse !== undefined) {
      if (typeof ui.sidebarAutoCollapse !== 'boolean') throw new AppError('ui.sidebarAutoCollapse phải là boolean', 400);
      patch.ui.sidebarAutoCollapse = ui.sidebarAutoCollapse;
    }
  }

  if (body.types && typeof body.types === 'object') {
    const types = body.types as Record<string, unknown>;
    patch.types = Object.entries(types).reduce<Record<string, { inAppEnabled?: boolean; emailEnabled?: boolean }>>(
      (acc, [type, value]) => {
        if (!value || typeof value !== 'object') return acc;
        const typeConfig = value as Record<string, unknown>;
        const sanitized: { inAppEnabled?: boolean; emailEnabled?: boolean } = {};
        if (typeConfig.inAppEnabled !== undefined) {
          if (typeof typeConfig.inAppEnabled !== 'boolean') {
            throw new AppError(`types.${type}.inAppEnabled phải là boolean`, 400);
          }
          sanitized.inAppEnabled = typeConfig.inAppEnabled;
        }
        if (typeConfig.emailEnabled !== undefined) {
          if (typeof typeConfig.emailEnabled !== 'boolean') {
            throw new AppError(`types.${type}.emailEnabled phải là boolean`, 400);
          }
          sanitized.emailEnabled = typeConfig.emailEnabled;
        }
        acc[type] = sanitized;
        return acc;
      },
      {}
    );
  }

  return patch;
};

export const getUserNotifications = async (req: Request, res: Response) => {
  const { cursor, limit } = req.query;
  const result = await notifService.getUserNotifications(req.user!.id, {
    cursor: cursor as string,
    limit: limit ? Number(limit) : 20,
  });
  sendSuccess(res, 200, 'OK', result);
};

export const getUnreadCount = async (req: Request, res: Response) => {
  const count = await notifService.getUnreadCount(req.user!.id);
  sendSuccess(res, 200, 'OK', { unreadCount: count });
};

export const markAsRead = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const updatedNotif = await notifService.markAsRead(id, req.user!.id);
  sendSuccess(res, 200, 'OK', updatedNotif);
};

export const markAllAsRead = async (req: Request, res: Response) => {
  const count = await notifService.markAllAsRead(req.user!.id);
  sendSuccess(res, 200, 'OK', { updatedCount: count });
};

export const getPreferences = async (req: Request, res: Response) => {
  const preferences = await preferenceService.getNotificationPreferences(req.user!.id);
  sendSuccess(res, 200, 'OK', preferences);
};

export const updatePreferences = async (req: Request, res: Response) => {
  const patch = sanitizePreferencesPatch(req.body);
  const preferences = await preferenceService.updateNotificationPreferences(req.user!.id, patch);
  sendSuccess(res, 200, 'OK', preferences);
};

