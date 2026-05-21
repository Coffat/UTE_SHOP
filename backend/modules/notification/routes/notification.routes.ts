import express from 'express';
import * as notifController from '../controllers/notification.controller.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { authenticate } from '../../../shared/middlewares/authenticate.js';

const router = express.Router();

router.get(
  '/',
  authenticate,
  asyncHandler(notifController.getUserNotifications)
);

router.patch(
  '/:id/read',
  authenticate,
  asyncHandler(notifController.markAsRead)
);

export default router;
