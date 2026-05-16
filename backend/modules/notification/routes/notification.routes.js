import express from 'express';
import * as notifService from '../services/notification.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate } from '../../../shared/middlewares/authenticate.js';

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'OK', await notifService.getUserNotifications(req.user.id, req.query));
}));

router.patch('/:id/read', authenticate, asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'OK', await notifService.markAsRead(req.params.id, req.user.id));
}));

export default router;
