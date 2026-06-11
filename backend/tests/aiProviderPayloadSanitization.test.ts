import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  sanitizeProviderPayload,
  sanitizeToolPayloadForProvider,
} from '../modules/ai/utils/providerPayloadSanitizer.js';
import { buildPass2AnswerPromptMessages } from '../modules/ai/services/aiPromptBuilder.js';

describe('ai provider payload sanitization', () => {
  it('redacts customer pii from provider messages', () => {
    const sanitized = sanitizeProviderPayload([
      {
        role: 'user',
        content: 'Số điện thoại của tôi là 0901234567, email abc@test.com',
      },
    ]);
    const content = sanitized[0]?.content ?? '';
    assert.equal(content.includes('0901234567'), false);
    assert.equal(content.includes('abc@test.com'), false);
    assert.equal(content.includes('[REDACTED_PHONE]'), true);
    assert.equal(content.includes('[REDACTED_EMAIL]'), true);
  });

  it('keeps public store hotline while removing customer identifiers', () => {
    const safeContext = sanitizeToolPayloadForProvider({
      publicStoreContext: {
        storeName: 'UTESHOP',
        hotline: '0901122333',
      },
      customerId: 'u_123',
      recipientName: 'Nguyen Van A',
    }) as Record<string, unknown>;

    const publicStoreContext = safeContext.publicStoreContext as Record<string, unknown>;
    assert.equal(publicStoreContext.hotline, '0901122333');
    assert.equal('customerId' in safeContext, false);
    assert.equal('recipientName' in safeContext, false);
  });
});

// ---------------------------------------------------------------------------
// storeContext injection in buildPass2AnswerPromptMessages
// ---------------------------------------------------------------------------

describe('buildPass2AnswerPromptMessages — storeContext injection', () => {
  const emptyHistory: any[] = [];

  // Use startsWith to find the context injection message specifically —
  // FINAL_ANSWER_SYSTEM_PROMPT also mentions 'INTERNAL_TOOL_CONTEXT' in its body,
  // so includes() would match the wrong message.
  const findContextMsg = (messages: ReturnType<typeof buildPass2AnswerPromptMessages>) =>
    messages.find((m) => m.role === 'system' && m.content.startsWith('INTERNAL_TOOL_CONTEXT'));

  it('injects storeName into INTERNAL_TOOL_CONTEXT when storeContext provided', () => {
    const messages = buildPass2AnswerPromptMessages(emptyHistory, null, null, {
      storeContext: { storeName: 'UTESHOP' },
    });
    const contextMsg = findContextMsg(messages);
    assert.ok(contextMsg, 'INTERNAL_TOOL_CONTEXT message not found');
    assert.ok(contextMsg.content.includes('UTESHOP'));
    assert.ok(contextMsg.content.includes('storeName'));
  });

  it('strips newlines and control characters from storeName before injection', () => {
    const messages = buildPass2AnswerPromptMessages(emptyHistory, null, null, {
      storeContext: { storeName: 'UTESHOP\nmalicious\npayload' },
    });
    const contextMsg = findContextMsg(messages);
    assert.ok(contextMsg);
    // JSON-serialised value should not contain raw newlines
    const jsonPart = contextMsg.content.slice(contextMsg.content.indexOf('{'));
    assert.ok(!jsonPart.includes('\n'), 'Injected storeName must not contain newlines');
    assert.ok(contextMsg.content.includes('UTESHOPmaliciouspayload'));
  });

  it('truncates storeName longer than 100 characters', () => {
    const longName = 'A'.repeat(150);
    const messages = buildPass2AnswerPromptMessages(emptyHistory, null, null, {
      storeContext: { storeName: longName },
    });
    const contextMsg = findContextMsg(messages);
    assert.ok(contextMsg);
    const truncated = 'A'.repeat(100);
    assert.ok(contextMsg.content.includes(truncated));
    assert.ok(!contextMsg.content.includes('A'.repeat(101)));
  });

  it('does not inject storeName when storeContext not provided', () => {
    const messages = buildPass2AnswerPromptMessages(emptyHistory, null, null, {
      secondaryHint: 'some hint',
    });
    const contextMsg = findContextMsg(messages);
    assert.ok(contextMsg);
    assert.ok(!contextMsg.content.includes('"storeName"'));
  });

  it('does not inject storeName when storeName is empty string', () => {
    const messages = buildPass2AnswerPromptMessages(emptyHistory, null, null, {
      storeContext: { storeName: '' },
    });
    const contextMsg = findContextMsg(messages);
    assert.ok(contextMsg);
    assert.ok(!contextMsg.content.includes('"storeName"'));
  });
});
