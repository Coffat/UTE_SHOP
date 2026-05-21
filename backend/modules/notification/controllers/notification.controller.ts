import { Request, Response } from 'express';
import * as notifService from '../services/notification.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export const getUserNotifications = async (req: Request, res: Response) => {
  const { page, limit } = req.query;
  const notifications = await notifService.getUserNotifications(req.user!.id, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  sendSuccess(res, 200, 'OK', notifications);
};

export const markAsRead = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  sendSuccess(res, 200, 'OK', await notifService.markAsRead(id, req.user!.id));
};
