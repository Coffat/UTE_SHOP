import express, { Request, Response } from 'express';
import * as notifService from '../services/notification.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate } from '../../../shared/middlewares/authenticate.js';

const router = express.Router();

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query;
    const notifications = await notifService.getUserNotifications(req.user!.id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    sendSuccess(res, 200, 'OK', notifications);
  })
);

router.patch(
  '/:id/read',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    sendSuccess(res, 200, 'OK', await notifService.markAsRead(id, req.user!.id));
  })
);

export default router;
