import { MAX_MESSAGE_CONTENT_LENGTH } from '../constants/chat.constants.js';

const TRUNCATION_SUFFIX = '\n\n… (tin nhắn đã được rút gọn)';

export const truncateChatMessageContent = (content: string): string => {
  const trimmed = content.trim();
  if (trimmed.length <= MAX_MESSAGE_CONTENT_LENGTH) return trimmed;

  const budget = MAX_MESSAGE_CONTENT_LENGTH - TRUNCATION_SUFFIX.length;
  if (budget <= 0) {
    return trimmed.slice(0, MAX_MESSAGE_CONTENT_LENGTH);
  }

  return `${trimmed.slice(0, budget).trimEnd()}${TRUNCATION_SUFFIX}`;
};
