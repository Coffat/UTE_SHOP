import type { ResolvedIntent } from './aiIntentResolver.service.js';

/**
 * Minimum message length (characters) to be considered a meaningful request.
 * Filters out greetings like "alo", "haha", "hi" that don't benefit from clarification.
 */
const MEANINGFUL_MIN_LENGTH = 8;

/**
 * Confidence threshold below which we attempt to clarify intent.
 */
const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Pattern to detect if the message contains at least one meaningful keyword
 * related to shopping, inquiry, or seeking help. Prevents Pass3 from firing
 * on pure greetings or spam messages.
 *
 * NOTE: \b (word boundary) does not work correctly with accented Vietnamese
 * characters. We use a simple substring match with word-separator awareness
 * via the 'i' flag, treating each keyword as a phrase that appears anywhere
 * in the message. This is intentionally permissive — the intent + confidence
 * guards are the primary filters; this is just a noise filter.
 */
const MEANINGFUL_PATTERN =
  /muốn|mua|cần|tìm|hỏi|xem|chọn|giúp|tư vấn|gợi ý|thế nào|như thế|làm sao|có không|bao nhiêu|được không|loại nào|nào ngon|nào đẹp|nào phù hợp|tặng|dịp nào|mấy giờ|ở đâu|giá|chi phí|ship/i;

/**
 * Determines whether Pass3 (clarifying question generation) should run
 * after Pass2 streaming completes.
 *
 * Conditions (ALL must be true):
 * 1. Primary intent is `general_no_tool` — no deterministic handler owns this
 * 2. Confidence is below threshold — AI is uncertain about the intent
 * 3. Message is long enough to be a real request (not "alo", "hi", "haha")
 * 4. Message contains at least one meaningful keyword
 */
export const shouldRunPass3 = (
  message: string,
  intent: ResolvedIntent,
): boolean => {
  if (intent.primaryIntent !== 'general_no_tool') return false;
  if (intent.confidence >= CONFIDENCE_THRESHOLD) return false;

  const trimmed = message.trim();
  if (trimmed.length < MEANINGFUL_MIN_LENGTH) return false;
  if (!MEANINGFUL_PATTERN.test(trimmed)) return false;

  return true;
};
