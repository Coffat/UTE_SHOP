import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import { getAdminReports } from '../services/reports.service.js';
import type { ReportsPeriod } from '../repositories/reports.repository.js';

const VALID_PERIODS: ReportsPeriod[] = ['7d', '30d', 'month'];

export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawPeriod = (req.query.period as string) ?? '30d';
    const period = VALID_PERIODS.includes(rawPeriod as ReportsPeriod)
      ? (rawPeriod as ReportsPeriod)
      : '30d';

    const rawLimit = parseInt(String(req.query.limit ?? '5'), 10);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 5;

    const data = await getAdminReports(period, limit);
    sendSuccess(res, 200, 'OK', data);
  } catch (error) {
    console.error('[reports.getReports]', error);
    sendError(res, 500, 'Không thể tải báo cáo');
  }
};
