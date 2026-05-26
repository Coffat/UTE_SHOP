import type { Request, Response } from 'express';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { getAdminDashboard } from '../services/dashboard.service.js';
import type { DashboardPeriod } from '../repositories/dashboard.repository.js';

const VALID_PERIODS: DashboardPeriod[] = ['7d', '30d'];

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const rawPeriod = (req.query.period as string) ?? '30d';
  const period = VALID_PERIODS.includes(rawPeriod as DashboardPeriod)
    ? (rawPeriod as DashboardPeriod)
    : '30d';

  const data = await getAdminDashboard(period);
  sendSuccess(res, 200, 'OK', data);
});
