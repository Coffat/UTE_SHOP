import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import Conversation from '../modules/chat/models/Conversation.js';
import { isConversationAiFinalizeAllowed } from '../modules/ai/services/aiStreamState.service.js';

describe('ai handoff race finalize gate', () => {
  it('blocks finalize when staff already assigned while ai is processing', async () => {
    const originalFindById = Conversation.findById.bind(Conversation);

    (Conversation as any).findById = () => ({
      select() {
        return {
          async lean() {
            return {
              status: 'staff_handling',
              assignedStaffId: 'staff_1',
              aiEnabled: true,
            };
          },
        };
      },
    });

    try {
      const allowed = await isConversationAiFinalizeAllowed('conversation_1');
      assert.equal(allowed, false);
    } finally {
      (Conversation as any).findById = originalFindById;
    }
  });
});

