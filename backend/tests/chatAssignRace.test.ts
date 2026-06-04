import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedConversationStatusTransition } from '../modules/chat/services/conversation.service.js';

describe('chat conversation status transitions', () => {
  it('allows waiting_staff -> staff_handling', () => {
    assert.equal(isAllowedConversationStatusTransition('waiting_staff', 'staff_handling'), true);
  });

  it('allows staff_handling -> resolved and resolved -> closed', () => {
    assert.equal(isAllowedConversationStatusTransition('staff_handling', 'resolved'), true);
    assert.equal(isAllowedConversationStatusTransition('resolved', 'closed'), true);
  });

  it('blocks invalid transitions from closed', () => {
    assert.equal(isAllowedConversationStatusTransition('closed', 'waiting_staff'), false);
    assert.equal(isAllowedConversationStatusTransition('closed', 'staff_handling'), false);
  });
});
