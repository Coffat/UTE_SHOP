import Campaign, { ICampaign } from '../models/Campaign.js';
import Voucher from '../models/Voucher.js';
import mongoose from 'mongoose';

export const createCampaign = async (data: Partial<ICampaign>): Promise<ICampaign> => {
  return Campaign.create(data);
};

export const updateCampaign = async (id: string, data: Partial<ICampaign>): Promise<ICampaign | null> => {
  const updatedCampaign = await Campaign.findByIdAndUpdate(id, data, { new: true });
  
  if (updatedCampaign && (data.startDate || data.endDate)) {
    // Cascade update vouchers to ensure they remain within campaign boundaries
    const vouchers = await Voucher.find({ campaign: updatedCampaign._id });
    for (const voucher of vouchers) {
      let needsSave = false;
      if (voucher.startDate < updatedCampaign.startDate) {
        voucher.startDate = updatedCampaign.startDate;
        needsSave = true;
      }
      if (voucher.endDate > updatedCampaign.endDate) {
        voucher.endDate = updatedCampaign.endDate;
        needsSave = true;
      }
      if (needsSave) {
        await voucher.save();
      }
    }
  }
  
  return updatedCampaign;
};

export const getActivePopupCampaigns = async (): Promise<ICampaign[]> => {
  const now = new Date();
  return Campaign.find({
    isActive: true,
    showPopup: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).sort({ createdAt: -1 });
};

export const getCampaigns = async (): Promise<ICampaign[]> => {
  return Campaign.find().sort({ createdAt: -1 });
};

export const toggleCampaign = async (id: string, isActive: boolean): Promise<ICampaign | null> => {
  return Campaign.findByIdAndUpdate(id, { isActive }, { new: true });
};

export const getCampaignStats = async (id: string) => {
  const campaignId = new mongoose.Types.ObjectId(id);
  
  // Aggregate voucher usage for this campaign
  const stats = await Voucher.aggregate([
    { $match: { campaign: campaignId } },
    {
      $group: {
        _id: null,
        totalVouchers: { $sum: 1 },
        totalUsedCount: { $sum: '$usedCount' }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalVouchers: 0,
      totalUsedCount: 0
    };
  }

  return {
    totalVouchers: stats[0].totalVouchers,
    totalUsedCount: stats[0].totalUsedCount
  };
};
