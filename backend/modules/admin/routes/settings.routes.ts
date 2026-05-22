import express from 'express';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import * as settingsController from '../controllers/settings.controller.js';
import { validateUpdateSettings } from '../middlewares/settings.validator.js';

const router = express.Router();

router.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  settingsController.getSettings
);

router.patch(
  '/',
  authenticate,
  authorize('ADMIN'),
  validateUpdateSettings,
  settingsController.updateSettings
);

router.post(
  '/rotate-api-key',
  authenticate,
  authorize('ADMIN'),
  settingsController.rotateApiKey
);

export default router;
