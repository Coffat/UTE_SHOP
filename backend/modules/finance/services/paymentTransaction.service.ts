import mongoose, { ClientSession, Types } from 'mongoose';
import { AppError } from '../../../shared/utils/AppError.js';
import PaymentTransaction, {
  IPaymentTransaction,
  PaymentProvider,
  PaymentTransactionStatus,
} from '../models/PaymentTransaction.js';

interface GetOrCreatePendingTransactionParams {
  orderId: string;
  provider: PaymentProvider;
  amount: number;
  requestPayload?: Record<string, unknown> | null;
  session?: ClientSession;
}

interface MarkTransactionParams {
  transactionRef: string;
  status: PaymentTransactionStatus.SUCCESS | PaymentTransactionStatus.FAILED | PaymentTransactionStatus.CANCELLED;
  providerTransactionId?: string | null;
  callbackPayload?: Record<string, unknown> | null;
  session?: ClientSession;
}

const DEFAULT_PENDING_TTL_MINUTES = 30;

const getPendingTtlMs = (): number => {
  const parsed = Number(process.env.PAYMENT_PENDING_TTL_MINUTES ?? DEFAULT_PENDING_TTL_MINUTES);
  const ttlMinutes = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PENDING_TTL_MINUTES;
  return ttlMinutes * 60 * 1000;
};

const buildTransactionRef = (provider: PaymentProvider): string => {
  const timestamp = Date.now();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${provider}-${timestamp}-${suffix}`;
};

const toDecimal128 = (amount: number) => mongoose.Types.Decimal128.fromString(amount.toFixed(0));

export const expireStalePendingTransactions = async (
  orderId: string,
  provider: PaymentProvider,
  session?: ClientSession
): Promise<void> => {
  const expiresBefore = new Date(Date.now() - getPendingTtlMs());
  await PaymentTransaction.updateMany(
    {
      orderId: new Types.ObjectId(orderId),
      provider,
      status: PaymentTransactionStatus.PENDING,
      createdAt: { $lt: expiresBefore },
    },
    { $set: { status: PaymentTransactionStatus.EXPIRED } },
    session ? { session } : {}
  );
};

export const getOrCreatePendingTransaction = async ({
  orderId,
  provider,
  amount,
  requestPayload = null,
  session,
}: GetOrCreatePendingTransactionParams): Promise<IPaymentTransaction> => {
  await expireStalePendingTransactions(orderId, provider, session);

  const pending = await PaymentTransaction.findOne({
    orderId: new Types.ObjectId(orderId),
    provider,
    status: PaymentTransactionStatus.PENDING,
  })
    .sort({ createdAt: -1 })
    .session(session || null);

  if (pending) {
    if (requestPayload) {
      pending.requestPayload = requestPayload;
      await pending.save(session ? { session } : {});
    }
    return pending;
  }

  let created: IPaymentTransaction | null = null;
  for (let retry = 0; retry < 3 && !created; retry += 1) {
    try {
      const [transaction] = await PaymentTransaction.create(
        [
          {
            orderId: new Types.ObjectId(orderId),
            provider,
            transactionRef: buildTransactionRef(provider),
            amount: toDecimal128(amount),
            status: PaymentTransactionStatus.PENDING,
            requestPayload,
          },
        ],
        session ? { session } : {}
      );
      created = transaction;
    } catch (error: unknown) {
      const code = (error as { code?: number }).code;
      if (code !== 11000) throw error;
    }
  }

  if (!created) {
    throw new AppError('Không thể tạo giao dịch thanh toán mới. Vui lòng thử lại.', 500);
  }

  return created;
};

export const setTransactionProviderResponse = async (
  transactionRef: string,
  responsePayload: Record<string, unknown>,
  session?: ClientSession
): Promise<IPaymentTransaction | null> => {
  return PaymentTransaction.findOneAndUpdate(
    { transactionRef },
    { $set: { responsePayload } },
    { new: true, ...(session ? { session } : {}) }
  );
};

export const appendTransactionCallbackPayload = async (
  transactionRef: string,
  callbackPayload: Record<string, unknown>,
  session?: ClientSession
): Promise<IPaymentTransaction | null> => {
  return PaymentTransaction.findOneAndUpdate(
    { transactionRef },
    { $set: { callbackPayload } },
    { new: true, ...(session ? { session } : {}) }
  );
};

export const markTransactionStatus = async ({
  transactionRef,
  status,
  providerTransactionId = null,
  callbackPayload = null,
  session,
}: MarkTransactionParams): Promise<IPaymentTransaction | null> => {
  const transaction = await PaymentTransaction.findOne({ transactionRef }).session(session || null);
  if (!transaction) return null;

  if (transaction.status === PaymentTransactionStatus.SUCCESS) {
    return transaction;
  }

  transaction.status = status;
  if (providerTransactionId) {
    transaction.providerTransactionId = providerTransactionId;
  }
  if (callbackPayload) {
    transaction.callbackPayload = callbackPayload;
  }
  await transaction.save(session ? { session } : {});
  return transaction;
};

export const getPaymentTransactionByRef = async (transactionRef: string): Promise<IPaymentTransaction | null> => {
  return PaymentTransaction.findOne({ transactionRef });
};

export const getLatestPaymentTransactionByOrder = async (
  orderId: string,
  provider?: PaymentProvider
): Promise<IPaymentTransaction | null> => {
  const filter: Record<string, unknown> = { orderId: new Types.ObjectId(orderId) };
  if (provider) filter.provider = provider;
  return PaymentTransaction.findOne(filter).sort({ createdAt: -1 });
};
