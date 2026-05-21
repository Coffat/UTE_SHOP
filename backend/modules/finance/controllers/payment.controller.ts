import { Request, Response } from 'express';
import * as paymentService from '../services/payment.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export const getPaymentsByOrder = async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string;
  sendSuccess(res, 200, 'OK', await paymentService.getPaymentsByOrder(orderId));
};

export const confirmPayment = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  sendSuccess(
    res, 200, 'Xác nhận thanh toán thành công',
    await paymentService.confirmPayment(id, req.body.transactionId)
  );
};

export const processPayment = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await paymentService.processPayment(id, req.body);
  sendSuccess(res, 200, 'Xử lý thanh toán thành công', result);
};

export const handleMomoWebhook = async (req: Request, res: Response) => {
  const result = await paymentService.handleWebhook('MOMO', req.body);
  sendSuccess(res, 200, 'IPN received and processed successfully', result);
};
