import { Request, Response } from 'express';
import * as notifService from '../services/notification.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

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

