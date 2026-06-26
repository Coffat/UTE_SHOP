import type { IMessage } from '../../chat/models/Message.js';
import {
  detectProductSearchIntent,
  detectProductSearchIntentFromHistory,
  type ProductSearchIntent,
} from './aiProductIntent.service.js';
import { isStoreInfoIntent } from './aiStoreInfo.service.js';

export type AiPrimaryIntent =
  | 'explicit_handoff_or_sensitive'
  | 'order_specific'
  | 'store_info'
  | 'strong_product'
  | 'product_follow_up'
  | 'order_policy'
  | 'store_policy_unknown'
  | 'general_no_tool';

export interface ResolvedIntent {
  primaryIntent: AiPrimaryIntent;
  secondaryIntents: AiPrimaryIntent[];
  confidence: number;
  productIntent: ProductSearchIntent | null;
  orderCode: string | null;
}

const OTHER_SUGGESTION_PATTERN =
  /\b(gợi ý khác|goi y khac|mẫu khác|mau khac|sản phẩm khác|san pham khac|xem thêm|xem them|khác đi|khac di)\b/i;
const ORDER_SPECIFIC_PATTERN =
  /\b(trạng thái|trang thai|đơn hàng|don hang|mã đơn|ma don|đơn của tôi|don cua toi|kiểm tra đơn|kiem tra don)\b/i;
const ORDER_POLICY_PATTERN =
  /\b(cách đặt đơn|cach dat don|theo dõi đơn|theo doi don|làm sao đặt|lam sao dat|hướng dẫn đặt|huong dan dat)\b/i;
const STORE_POLICY_PATTERN =
  /\b(đổi trả|doi tra|hoàn tiền|hoan tien|refund|phí hủy|phi huy|hủy đơn|huy don|chính sách giao hàng|chinh sach giao hang|phí giao hàng|phi giao hang)\b/i;
const SENSITIVE_ACTION_PATTERN =
  /\b(hủy|huy|hoàn tiền|hoan tien|đổi địa chỉ|doi dia chi|thanh toán lỗi|thanh toan loi|khiếu nại|khieu nai|gặp nhân viên|gap nhan vien)\b/i;
const ORDER_CODE_PATTERN = /\b(?:UTE\d{8}-\d{4}-(?:COD|MOMO|VNPAY|CASH)|ORD-[A-Z0-9-]{4,}|DH[0-9A-Z-]{2,})\b/i;

const getRecentCustomerTexts = (historyRows: IMessage[], limit = 5): string[] =>
  historyRows
    .filter((row) => row.senderType === 'customer')
    .map((row) => row.content.trim())
    .filter(Boolean)
    .slice(-limit);

const pushSecondary = (bucket: Set<AiPrimaryIntent>, primary: AiPrimaryIntent, intent: AiPrimaryIntent) => {
  if (primary !== intent) {
    bucket.add(intent);
  }
};

const classifyIntentCandidates = (
  latestMessage: string,
  recentCustomerTexts: string[]
): {
  sensitive: boolean;
  orderSpecific: boolean;
  storeInfo: boolean;
  productStrong: boolean;
  productFollowUp: boolean;
  orderPolicy: boolean;
  storePolicy: boolean;
  productIntent: ProductSearchIntent | null;
  orderCode: string | null;
} => {
  const trimmed = latestMessage.trim();
  const productIntent = detectProductSearchIntent(trimmed);
  const productFollowUpIntent =
    OTHER_SUGGESTION_PATTERN.test(trimmed) && detectProductSearchIntentFromHistory(recentCustomerTexts);
  const orderCodeMatch = trimmed.match(ORDER_CODE_PATTERN);
  const orderCode = orderCodeMatch ? orderCodeMatch[0].trim().toUpperCase() : null;
  const orderSpecific = ORDER_SPECIFIC_PATTERN.test(trimmed) && Boolean(orderCode);

  return {
    sensitive: SENSITIVE_ACTION_PATTERN.test(trimmed),
    orderSpecific,
    storeInfo: isStoreInfoIntent(trimmed),
    productStrong: Boolean(productIntent),
    productFollowUp: Boolean(productFollowUpIntent),
    orderPolicy: ORDER_POLICY_PATTERN.test(trimmed),
    storePolicy: STORE_POLICY_PATTERN.test(trimmed),
    productIntent: productIntent ?? productFollowUpIntent ?? null,
    orderCode,
  };
};

export const resolveIntentWithPrecedence = (
  latestMessage: string,
  historyRows: IMessage[]
): ResolvedIntent => {
  const recentCustomerTexts = getRecentCustomerTexts(historyRows);
  const candidates = classifyIntentCandidates(latestMessage, recentCustomerTexts);
  const secondary = new Set<AiPrimaryIntent>();
  let primaryIntent: AiPrimaryIntent = 'general_no_tool';
  let confidence = 0.6;

  if (candidates.sensitive) {
    primaryIntent = 'explicit_handoff_or_sensitive';
    confidence = 0.98;
  } else if (candidates.orderSpecific) {
    primaryIntent = 'order_specific';
    confidence = 0.95;
  } else if (candidates.storeInfo) {
    primaryIntent = 'store_info';
    confidence = 0.93;
  } else if (candidates.productStrong) {
    primaryIntent = 'strong_product';
    confidence = 0.9;
  } else if (candidates.productFollowUp) {
    primaryIntent = 'product_follow_up';
    confidence = 0.82;
  } else if (candidates.orderPolicy) {
    primaryIntent = 'order_policy';
    confidence = 0.8;
  } else if (candidates.storePolicy) {
    primaryIntent = 'store_policy_unknown';
    confidence = 0.84;
  }

  if (candidates.orderSpecific) pushSecondary(secondary, primaryIntent, 'order_specific');
  if (candidates.storeInfo) pushSecondary(secondary, primaryIntent, 'store_info');
  if (candidates.productStrong) pushSecondary(secondary, primaryIntent, 'strong_product');
  if (candidates.productFollowUp) pushSecondary(secondary, primaryIntent, 'product_follow_up');
  if (candidates.orderPolicy) pushSecondary(secondary, primaryIntent, 'order_policy');
  if (candidates.storePolicy) pushSecondary(secondary, primaryIntent, 'store_policy_unknown');
  if (candidates.sensitive) pushSecondary(secondary, primaryIntent, 'explicit_handoff_or_sensitive');

  return {
    primaryIntent,
    secondaryIntents: [...secondary],
    confidence,
    productIntent: candidates.productIntent,
    orderCode: candidates.orderCode,
  };
};

export const canAiRespondDuringHandoff = (intent: AiPrimaryIntent): boolean => {
  // While a handoff is already queued, block only a second handoff request.
  // All other intents (product search, order status, store info, etc.) should
  // still be answered so the customer isn't left waiting with no help.
  return intent !== 'explicit_handoff_or_sensitive';
};

export const buildSecondaryIntentHint = (secondaryIntents: AiPrimaryIntent[]): string => {
  if (secondaryIntents.includes('strong_product') || secondaryIntents.includes('product_follow_up')) {
    return 'Bạn cũng đang quan tâm sản phẩm, mình có thể gợi ý tiếp ở tin nhắn kế tiếp nhé.';
  }
  if (secondaryIntents.includes('order_specific')) {
    return 'Nếu bạn muốn mình kiểm tra trạng thái đơn, vui lòng gửi đúng mã đơn để mình tra cứu giúp.';
  }
  return '';
};

