import { VNPay, HashAlgorithm, ProductCode } from 'vnpay';
import { AppError } from '../../../shared/utils/AppError.js';
import { formatVnpDate } from '../helpers/vnpaySignature.helper.js';

interface CreateVnpayPaymentInput {
  orderCode: string;
  transactionRef: string;
  amount: number;
  ipAddress?: string;
}

interface VnpayConfig {
  tmnCode: string;
  hashSecret: string;
  paymentUrl: string;
  returnUrl: string;
}

const getVnpayConfig = (): VnpayConfig => {
  const tmnCode = process.env.VNPAY_TMN_CODE?.trim();
  const hashSecret = process.env.VNPAY_HASH_SECRET?.trim();
  const paymentUrl = process.env.VNPAY_PAYMENT_URL?.trim();
  const returnUrl = process.env.VNPAY_RETURN_URL?.trim();
  if (!tmnCode || !hashSecret || !paymentUrl || !returnUrl) {
    throw new AppError('Thiếu cấu hình VNPAY Sandbox trong biến môi trường', 500);
  }
  return { tmnCode, hashSecret, paymentUrl, returnUrl };
};

const createVnpayClient = (config: VnpayConfig): VNPay =>
  new VNPay({
    tmnCode: config.tmnCode,
    secureSecret: config.hashSecret,
    vnpayHost: 'https://sandbox.vnpayment.vn',
    testMode: true,
    hashAlgorithm: HashAlgorithm.SHA512,
    enableLog: false,
  });

export const createVnpaySandboxPayment = async ({
  orderCode,
  transactionRef,
  amount,
  ipAddress,
}: CreateVnpayPaymentInput): Promise<{
  paymentUrl: string;
  requestPayload: Record<string, string>;
}> => {
  const config = getVnpayConfig();
  const vnpay = createVnpayClient(config);

  const requestPayload: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: config.tmnCode,
    vnp_Amount: String(Math.round(amount) * 100),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: transactionRef,
    vnp_OrderInfo: `Thanh toan don ${orderCode}`.slice(0, 255),
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: config.returnUrl,
    vnp_IpAddr: ipAddress || '127.0.0.1',
    vnp_CreateDate: formatVnpDate(),
    vnp_ExpireDate: formatVnpDate(new Date(Date.now() + 15 * 60 * 1000)),
  };

  const paymentUrl = vnpay.buildPaymentUrl({
    vnp_Amount: Math.round(amount),
    vnp_IpAddr: ipAddress || '127.0.0.1',
    vnp_TxnRef: transactionRef,
    vnp_OrderInfo: requestPayload.vnp_OrderInfo,
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: config.returnUrl,
    vnp_ExpireDate: Number(requestPayload.vnp_ExpireDate),
  });

  return { paymentUrl, requestPayload };
};

export const verifyVnpaySignature = (query: Record<string, string | undefined>): boolean => {
  if (!query.vnp_SecureHash) return false;

  try {
    const config = getVnpayConfig();
    const vnpay = createVnpayClient(config);
    const filtered = Object.fromEntries(
      Object.entries(query).filter(([, value]) => value != null && value !== '')
    ) as Record<string, string>;
    return vnpay.verifyReturnUrl(filtered as Parameters<VNPay['verifyReturnUrl']>[0]).isVerified;
  } catch {
    return false;
  }
};
