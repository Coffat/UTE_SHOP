import { AppError } from '../../../shared/utils/AppError.js';
import { buildMomoRawSignature, signMomoPayload } from '../helpers/momoSignature.helper.js';
import { timingSafeEqual } from 'crypto';

interface CreateMomoPaymentInput {
  orderCode: string;
  orderId: string;
  transactionRef: string;
  amount: number;
}

interface MomoCreateResponse {
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
  resultCode?: number;
  message?: string;
  [key: string]: unknown;
}

interface MomoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  endpoint: string;
  redirectUrl: string;
  ipnUrl: string;
}

const getMomoConfig = (): MomoConfig => {
  const partnerCode = process.env.MOMO_PARTNER_CODE?.trim();
  const accessKey = process.env.MOMO_ACCESS_KEY?.trim();
  const secretKey = process.env.MOMO_SECRET_KEY?.trim();
  const endpoint = process.env.MOMO_ENDPOINT?.trim();
  const redirectUrl = process.env.MOMO_REDIRECT_URL?.trim();
  const ipnUrl = process.env.MOMO_IPN_URL?.trim();

  if (!partnerCode || !accessKey || !secretKey || !endpoint || !redirectUrl || !ipnUrl) {
    throw new AppError('Thiếu cấu hình MoMo Sandbox trong biến môi trường', 500);
  }

  return { partnerCode, accessKey, secretKey, endpoint, redirectUrl, ipnUrl };
};

export const createMomoSandboxPayment = async ({
  orderCode,
  orderId,
  transactionRef,
  amount,
}: CreateMomoPaymentInput): Promise<{
  requestPayload: Record<string, unknown>;
  responsePayload: MomoCreateResponse;
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
}> => {
  const config = getMomoConfig();
  const amountText = String(Math.round(amount));
  const requestId = transactionRef;
  const momoOrderId = transactionRef;
  const orderInfo = `Thanh toan don ${orderCode}`;
  const extraData = Buffer.from(JSON.stringify({ orderId, transactionRef }), 'utf8').toString('base64');
  const requestType = 'captureWallet';

  const rawSignature = buildMomoRawSignature({
    accessKey: config.accessKey,
    amount: amountText,
    extraData,
    ipnUrl: config.ipnUrl,
    orderId: momoOrderId,
    orderInfo,
    partnerCode: config.partnerCode,
    redirectUrl: config.redirectUrl,
    requestId,
    requestType,
  });

  const signature = signMomoPayload(rawSignature, config.secretKey);
  const requestPayload: Record<string, unknown> = {
    partnerCode: config.partnerCode,
    accessKey: config.accessKey,
    partnerName: 'UTE_SHOP',
    storeId: 'UTE_SHOP',
    requestId,
    amount: Math.round(amount),
    orderId: momoOrderId,
    orderInfo,
    redirectUrl: config.redirectUrl,
    ipnUrl: config.ipnUrl,
    lang: 'vi',
    extraData,
    requestType,
    signature,
  };

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload),
    signal: AbortSignal.timeout(10_000),
  });

  const responsePayload = (await response.json()) as MomoCreateResponse;
  if (!response.ok) {
    throw new AppError(
      `Tạo thanh toán MoMo thất bại: ${responsePayload.message || 'Gateway error'}`,
      400
    );
  }

  if (Number(responsePayload.resultCode) !== 0 || !responsePayload.payUrl) {
    throw new AppError(
      `MoMo không trả về liên kết thanh toán hợp lệ: ${responsePayload.message || 'Không rõ lỗi'}`,
      400
    );
  }

  return {
    requestPayload,
    responsePayload,
    payUrl: responsePayload.payUrl,
    deeplink: responsePayload.deeplink,
    qrCodeUrl: responsePayload.qrCodeUrl,
  };
};

const buildMomoIpnRawSignature = (payload: Record<string, unknown>): string => {
  const get = (key: string) => String(payload[key] ?? '');
  return [
    `amount=${get('amount')}`,
    `extraData=${get('extraData')}`,
    `message=${get('message')}`,
    `orderId=${get('orderId')}`,
    `orderInfo=${get('orderInfo')}`,
    `orderType=${get('orderType')}`,
    `partnerCode=${get('partnerCode')}`,
    `payType=${get('payType')}`,
    `requestId=${get('requestId')}`,
    `responseTime=${get('responseTime')}`,
    `resultCode=${get('resultCode')}`,
    `transId=${get('transId')}`,
  ].join('&');
};

export const verifyMomoIpnSignature = (payload: Record<string, unknown>): boolean => {
  const config = getMomoConfig();
  const signature = String(payload.signature ?? '');
  if (!signature) return false;
  const rawSignature = buildMomoIpnRawSignature(payload);
  const computed = signMomoPayload(rawSignature, config.secretKey);
  if (computed.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(computed, 'utf8'), Buffer.from(signature, 'utf8'));
};
