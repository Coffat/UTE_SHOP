import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Message from '../modules/chat/models/Message.js';
import {
  MAX_MESSAGE_CONTENT_LENGTH,
  MAX_MESSAGE_PAGE_SIZE,
} from '../modules/chat/constants/chat.constants.js';

describe('chat message model/index and constants', () => {
  it('enforces expected guard constants', () => {
    assert.equal(MAX_MESSAGE_CONTENT_LENGTH, 2000);
    assert.equal(MAX_MESSAGE_PAGE_SIZE, 100);
  });

  it('has idempotency unique index for clientMessageId', () => {
    const indexes = Message.schema.indexes();
    const idempotencyIndex = indexes.find((entry) => {
      const key = entry[0] as Record<string, number>;
      return (
        key.conversationId === 1 &&
        key.senderId === 1 &&
        key.clientMessageId === 1 &&
        Boolean((entry[1] as Record<string, unknown>).unique)
      );
    });
    assert.ok(idempotencyIndex, 'Expected unique idempotency index on conversationId/senderId/clientMessageId');
  });
});
