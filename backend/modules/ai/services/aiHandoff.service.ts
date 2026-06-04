import type { AiHandoffDecision } from '../types/ai.types.js';

interface RuleMatcher {
  reason: string;
  patterns: RegExp[];
}

const HANDOFF_RULES: RuleMatcher[] = [
  { reason: 'customer_requested_staff', patterns: [/\b(gặp|nói chuyện với|kết nối)\b.{0,12}\b(nhân viên|người thật)\b/i] },
  { reason: 'order_cancellation', patterns: [/\b(hủy|huy)\b.{0,8}\b(đơn|don)\b/i] },
  { reason: 'refund_request', patterns: [/\b(hoàn tiền|refund|trả tiền lại)\b/i] },
  { reason: 'change_shipping_address', patterns: [/\b(đổi|thay đổi|sửa)\b.{0,12}\b(địa chỉ|dia chi)\b/i] },
  { reason: 'payment_issue', patterns: [/\b(lỗi|loi|không được|that bai)\b.{0,12}\b(thanh toán|thanh toan|payment)\b/i] },
  { reason: 'complaint_or_angry', patterns: [/\b(khiếu nại|khieu nai|bực|tức|tuc|không hài lòng|khong hai long)\b/i] },
  { reason: 'order_status_needs_tool', patterns: [/\b(trạng thái|trang thai|đơn hàng|don hang)\b.{0,15}\b(mã|ma|#|id)\b/i] },
];

const HANDOFF_MARKER_REGEX = /\[HANDOFF_REQUIRED:\s*([a-zA-Z0-9_\-]+)\s*\]/g;

export const evaluatePrecheckHandoff = (content: string): AiHandoffDecision => {
  const normalized = content.trim();
  for (const rule of HANDOFF_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return { required: true, reason: rule.reason };
    }
  }
  return { required: false, reason: null };
};

export const extractHandoffMarker = (content: string) => {
  let reason: string | null = null;
  let cleaned = content;
  cleaned = cleaned.replace(HANDOFF_MARKER_REGEX, (_whole, markerReason: string) => {
    reason = reason ?? markerReason;
    return '';
  });
  return {
    cleanedContent: cleaned.trim(),
    reason,
  };
};

export const buildSafeHandoffMessage = () => {
  return 'Mình đã chuyển cuộc trò chuyện sang nhân viên để hỗ trợ chính xác hơn cho bạn. Bạn vui lòng chờ trong giây lát nhé.';
};

