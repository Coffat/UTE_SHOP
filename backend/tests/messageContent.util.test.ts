import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MAX_MESSAGE_CONTENT_LENGTH } from '../modules/chat/constants/chat.constants.js';
import { truncateChatMessageContent } from '../modules/chat/utils/messageContent.util.js';

describe('truncateChatMessageContent', () => {
  it('returns unchanged content when within limit', () => {
    const short = 'Xin chào shop';
    assert.equal(truncateChatMessageContent(short), short);
  });

  it('truncates content longer than MAX_MESSAGE_CONTENT_LENGTH', () => {
    const long = 'a'.repeat(MAX_MESSAGE_CONTENT_LENGTH + 500);
    const result = truncateChatMessageContent(long);
    assert.ok(result.length <= MAX_MESSAGE_CONTENT_LENGTH);
    assert.match(result, /rút gọn/);
  });
});
