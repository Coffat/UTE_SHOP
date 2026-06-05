import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Message from '../modules/chat/models/Message.js';
import Conversation from '../modules/chat/models/Conversation.js';
import {
  CHAT_SENDER_TYPES,
  MAX_MESSAGE_PAGE_SIZE,
} from '../modules/chat/constants/chat.constants.js';

describe('ai schema and chat constants', () => {
  it('keeps paging constant unchanged', () => {
    assert.equal(MAX_MESSAGE_PAGE_SIZE, 100);
  });

  it('includes ai sender type', () => {
    assert.equal(CHAT_SENDER_TYPES.includes('ai' as any), true);
  });

  it('conversation schema has ai-related fields', () => {
    const paths = Conversation.schema.paths;
    assert.ok(paths.aiEnabled, 'Expected aiEnabled field');
    assert.ok(paths.lastAiResponseAt, 'Expected lastAiResponseAt field');
    assert.ok(paths.handoffReason, 'Expected handoffReason field');
    assert.ok(paths.aiFailureCount, 'Expected aiFailureCount field');
  });

  it('message schema supports metadata for ai responses', () => {
    const metadataPath = Message.schema.path('metadata');
    assert.ok(metadataPath, 'Expected metadata path in message schema');
  });
});

