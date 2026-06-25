import { Request, Response } from 'express';
import * as campaignService from '../services/campaign.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';

export const createCampaign = async (req: Request, res: Response) => {
  const campaign = await campaignService.createCampaign(req.body);
  sendSuccess(res, 201, 'Tạo chiến dịch thành công', campaign);
};

export const updateCampaign = async (req: Request, res: Response) => {
  const campaign = await campaignService.updateCampaign(req.params.id, req.body);
  sendSuccess(res, 200, 'Cập nhật chiến dịch thành công', campaign);
};

export const getCampaigns = async (req: Request, res: Response) => {
  const campaigns = await campaignService.getCampaigns();
  sendSuccess(res, 200, 'Lấy danh sách chiến dịch thành công', campaigns);
};

export const toggleCampaign = async (req: Request, res: Response) => {
  const campaign = await campaignService.toggleCampaign(req.params.id, req.body.isActive);
  sendSuccess(res, 200, 'Cập nhật trạng thái chiến dịch thành công', campaign);
};

export const getCampaignStats = async (req: Request, res: Response) => {
  const stats = await campaignService.getCampaignStats(req.params.id);
  sendSuccess(res, 200, 'Lấy thống kê chiến dịch thành công', stats);
};

export const getActivePopupCampaigns = async (req: Request, res: Response) => {
  const campaigns = await campaignService.getActivePopupCampaigns();
  sendSuccess(res, 200, 'Lấy danh sách chiến dịch popup thành công', campaigns);
};
