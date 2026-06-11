import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canAiRespondDuringHandoff } from '../modules/ai/services/aiIntentResolver.service.js';

describe('handoff response allowlist', () => {
  it('allows only faq/general intents while waiting staff', () => {
    assert.equal(canAiRespondDuringHandoff('store_info'), true);
    assert.equal(canAiRespondDuringHandoff('general_no_tool'), true);
    assert.equal(canAiRespondDuringHandoff('order_specific'), false);
    assert.equal(canAiRespondDuringHandoff('strong_product'), false);
    assert.equal(canAiRespondDuringHandoff('store_policy_unknown'), false);
  });
});

