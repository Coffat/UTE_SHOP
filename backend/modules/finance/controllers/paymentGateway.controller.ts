import { Request, Response } from 'express';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import * as paymentGatewayService from '../services/paymentGateway.service.js';
import { AppError } from '../../../shared/utils/AppError.js';

const getClientIp = (req: Request): string => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (typeof xForwardedFor === 'string' && xForwardedFor.length > 0) {
    return xForwardedFor.split(',')[0].trim();
  }
  return req.ip || '127.0.0.1';
};

export const createMomoPayment = async (req: Request, res: Response) => {
  const result = await paymentGatewayService.createMomoPaymentUrl(req.body.orderId, req.user!);
  sendSuccess(res, 200, 'Tạo liên kết thanh toán MoMo thành công', result);
};

export const createVnpayPayment = async (req: Request, res: Response) => {
  const result = await paymentGatewayService.createVnpayPaymentUrl(req.body.orderId, req.user!, getClientIp(req));
  sendSuccess(res, 200, 'Tạo liên kết thanh toán VNPAY thành công', result);
};

export const handleMomoIpn = async (req: Request, res: Response) => {
  await paymentGatewayService.handleMomoIpn(req.body);
  res.status(204).send();
};

export const handleVnpayIpn = async (req: Request, res: Response) => {
  try {
    await paymentGatewayService.handleVnpayIpn(req.query as Record<string, string | undefined>);
    res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      const message = error.message.toLowerCase();
      if (message.includes('signature')) {
        res.status(200).json({ RspCode: '97', Message: 'Fail checksum' });
        return;
      }
      if (message.includes('không tìm thấy transaction')) {
        res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        return;
      }
      if (message.includes('amount không khớp')) {
        res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
        return;
      }
      res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
      return;
    }
    throw error;
  }
};

export const handleMomoReturn = async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL?.trim() || process.env.APP_PUBLIC_URL?.trim() || '';
  const searchParams = new URLSearchParams(req.query as Record<string, string>);
  if (!searchParams.get('provider')) {
    searchParams.set('provider', 'MOMO');
  }

  if (!frontendUrl) {
    sendSuccess(res, 200, 'MoMo return received', Object.fromEntries(searchParams.entries()));
    return;
  }

  res.redirect(`${frontendUrl.replace(/\/$/, '')}/payment-result?${searchParams.toString()}`);
};

export const handleVnpayReturn = async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL?.trim() || process.env.APP_PUBLIC_URL?.trim() || '';
  const searchParams = new URLSearchParams(req.query as Record<string, string>);
  if (!searchParams.get('provider')) {
    searchParams.set('provider', 'VNPAY');
  }

  if (!frontendUrl) {
    sendSuccess(res, 200, 'VNPAY return received', Object.fromEntries(searchParams.entries()));
    return;
  }

  res.redirect(`${frontendUrl.replace(/\/$/, '')}/payment-result?${searchParams.toString()}`);
};

export const getOrderPaymentStatus = async (req: Request, res: Response) => {
  const orderId = String(req.params.orderId || req.params.id || '');
  const result = await paymentGatewayService.getOrderPaymentStatus(orderId, req.user!);
  sendSuccess(res, 200, 'OK', result);
};

export const getPaymentStatusByTransactionRef = async (req: Request, res: Response) => {
  const transactionRef = String(req.params.transactionRef || '');
  const result = await paymentGatewayService.getPaymentStatusByTransactionRef(transactionRef, req.user!);
  sendSuccess(res, 200, 'OK', result);
};
