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
