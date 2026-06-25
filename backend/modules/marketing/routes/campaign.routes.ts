import express from 'express';
import * as campaignController from '../controllers/campaign.controller.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import {
  validateCreateCampaign,
  validateUpdateCampaign,
} from '../middlewares/marketing.validator.js';

const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get('/active-popup', asyncHandler(campaignController.getActivePopupCampaigns));

// ─── Protected Routes (Admin/Sales) ───────────────────────────────────────────
const adminMiddleware = [authenticate, authorize('ADMIN', 'SALES')];

router.get('/', ...adminMiddleware, asyncHandler(campaignController.getCampaigns));

router.post('/', ...adminMiddleware, validateCreateCampaign, asyncHandler(campaignController.createCampaign));

router.patch('/:id', ...adminMiddleware, validateUpdateCampaign, asyncHandler(campaignController.updateCampaign));

router.patch('/:id/toggle', ...adminMiddleware, asyncHandler(campaignController.toggleCampaign));

router.get('/:id/stats', ...adminMiddleware, asyncHandler(campaignController.getCampaignStats));

export default router;
