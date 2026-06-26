import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from '../modules/order/models/Order.js';
import OrderDailySequence from '../modules/order/models/OrderDailySequence.js';
import PaymentMethod from '../shared/enums/PaymentMethod.js';

dotenv.config();

const ORDER_CODE_PREFIX = 'UTE';
const ORDER_CODE_SEQUENCE_PAD = 4;
const ORDER_CODE_TIMEZONE = 'Asia/Ho_Chi_Minh';

const getVietnamDateParts = (date = new Date()): { day: string; month: string; year: string } => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: ORDER_CODE_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const parts = formatter.formatToParts(date);
  const day = parts.find((part) => part.type === 'day')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const year = parts.find((part) => part.type === 'year')?.value;
  if (!day || !month || !year) {
    throw new Error('Cannot resolve Vietnam date parts');
  }
  return { day, month, year };
};

const resolvePaymentMethod = (value: unknown): PaymentMethod => {
  const candidate = String(value || '').toUpperCase();
  if (candidate === PaymentMethod.MOMO) return PaymentMethod.MOMO;
  if (candidate === PaymentMethod.VNPAY) return PaymentMethod.VNPAY;
  if (candidate === PaymentMethod.CASH) return PaymentMethod.CASH;
  return PaymentMethod.COD;
};

const buildOrderCode = (sequence: number, paymentMethod: PaymentMethod, createdAt: Date): string => {
  const { day, month, year } = getVietnamDateParts(createdAt);
  const datePart = `${day}${month}${year}`;
  const paddedSequence = String(sequence).padStart(ORDER_CODE_SEQUENCE_PAD, '0');
  return `${ORDER_CODE_PREFIX}${datePart}-${paddedSequence}-${paymentMethod}`;
};

const buildSequenceKey = (createdAt: Date): string => {
  const { day, month, year } = getVietnamDateParts(createdAt);
  return `${year}-${month}-${day}`;
};

const buildBusinessDate = (createdAt: Date): string => {
  const { day, month, year } = getVietnamDateParts(createdAt);
  return `${day}${month}${year}`;
};

const run = async () => {
  const isDryRun = process.argv.includes('--dry-run');
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/uteshop';

  console.log(`[migration] connect ${mongoUri}`);
  await mongoose.connect(mongoUri);

  const orders = await Order.find({}, { _id: 1, createdAt: 1, paymentMethod: 1, orderCode: 1 })
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  console.log(`[migration] total orders: ${orders.length}`);

  const sequenceByDate = new Map<string, number>();
  const maxSequenceByDate = new Map<string, number>();
  const businessDateByKey = new Map<string, string>();

  let unchangedCount = 0;
  let changedCount = 0;
  const bulkOps: Array<{ updateOne: { filter: { _id: mongoose.Types.ObjectId }; update: { $set: { orderCode: string } } } }> = [];

  for (const order of orders) {
    const createdAt = new Date(order.createdAt || new Date());
    const sequenceKey = buildSequenceKey(createdAt);
    businessDateByKey.set(sequenceKey, buildBusinessDate(createdAt));
    const currentSequence = sequenceByDate.get(sequenceKey) ?? 0;
    const nextSequence = currentSequence + 1;
    sequenceByDate.set(sequenceKey, nextSequence);
    maxSequenceByDate.set(sequenceKey, nextSequence);

    const paymentMethod = resolvePaymentMethod(order.paymentMethod);
    const nextCode = buildOrderCode(nextSequence, paymentMethod, createdAt);
    if (order.orderCode === nextCode) {
      unchangedCount += 1;
      continue;
    }
    changedCount += 1;

    bulkOps.push({
      updateOne: {
        filter: { _id: order._id as mongoose.Types.ObjectId },
        update: { $set: { orderCode: nextCode } },
      },
    });
  }

  console.log(`[migration] will change: ${changedCount}, unchanged: ${unchangedCount}`);

  if (!isDryRun && bulkOps.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < bulkOps.length; i += chunkSize) {
      const chunk = bulkOps.slice(i, i + chunkSize);
      await Order.bulkWrite(chunk, { ordered: true });
      console.log(`[migration] updated ${Math.min(i + chunk.length, bulkOps.length)}/${bulkOps.length}`);
    }

    await OrderDailySequence.deleteMany({});
    if (maxSequenceByDate.size > 0) {
      const sequenceOps = Array.from(maxSequenceByDate.entries()).map(([dateKey, sequence]) => ({
        updateOne: {
          filter: { _id: dateKey },
          update: {
            $set: {
              businessDate: businessDateByKey.get(dateKey) || dateKey.replace(/-/g, ''),
              sequence,
              timezone: ORDER_CODE_TIMEZONE,
            },
          },
          upsert: true,
        },
      }));
      await OrderDailySequence.bulkWrite(sequenceOps, { ordered: true });
    }
    console.log('[migration] order daily sequence synced');
  } else {
    console.log('[migration] dry-run mode, no data was changed');
  }

  await mongoose.disconnect();
  console.log('[migration] done');
};

run().catch(async (error) => {
  console.error('[migration] failed', error);
  await mongoose.disconnect();
  process.exit(1);
});
