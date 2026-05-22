import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  statusCode = 200,
  message = 'Success',
  data: any = null
): Response => {
  const payload: { success: boolean; message: string; data?: any } = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  statusCode = 500,
  message = 'Internal Server Error',
  errors: any = null
): Response => {
  const payload: { success: boolean; message: string; errors?: any } = { success: false, message };
  if (errors !== null) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

/**
 * sendPaginated — helper for new /admin/* list endpoints.
 * Returns { success, message, data: items[], meta: { page, limit, total, totalPages, ...extras } }.
 * Old endpoints continue using sendSuccess with their existing format.
 * The meta object may carry additional domain-specific counts (e.g. activeCount, inactiveCount).
 */
export const sendPaginated = (
  res: Response,
  items: any[],
  meta: { page: number; limit: number; total: number; totalPages: number } & Record<string, unknown>,
  message = 'OK',
  statusCode = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: items,
    meta,
  });
};
