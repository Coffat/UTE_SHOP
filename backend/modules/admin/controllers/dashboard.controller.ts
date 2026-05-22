import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import { getAdminDashboard } from '../services/dashboard.service.js';
import type { DashboardPeriod } from '../repositories/dashboard.repository.js';

const VALID_PERIODS: DashboardPeriod[] = ['7d', '30d'];

export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawPeriod = (req.query.period as string) ?? '30d';
    const period = VALID_PERIODS.includes(rawPeriod as DashboardPeriod)
      ? (rawPeriod as DashboardPeriod)
      : '30d';

    const data = await getAdminDashboard(period);
    sendSuccess(res, 200, 'OK', data);
  } catch (error) {
    console.error('[dashboard.getDashboard]', error);
    sendError(res, 500, 'Không thể tải dữ liệu dashboard');
  }
};
