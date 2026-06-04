import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePrecheckHandoff, extractHandoffMarker } from '../modules/ai/services/aiHandoff.service.js';

describe('ai handoff rules', () => {
  it('matches handoff precheck for sensitive customer intents', () => {
    const decision = evaluatePrecheckHandoff('Mình muốn hủy đơn hàng và gặp nhân viên ngay');
    assert.equal(decision.required, true);
    assert.equal(decision.reason, 'customer_requested_staff');
  });

  it('does not force handoff for normal FAQ message', () => {
    const decision = evaluatePrecheckHandoff('Shop có mở cửa đến mấy giờ vậy?');
    assert.equal(decision.required, false);
    assert.equal(decision.reason, null);
  });

  it('removes handoff marker from assistant content', () => {
    const parsed = extractHandoffMarker(
      'Mình sẽ chuyển bạn cho nhân viên hỗ trợ ngay nhé. [HANDOFF_REQUIRED:refund_request]'
    );
    assert.equal(parsed.reason, 'refund_request');
    assert.equal(parsed.cleanedContent.includes('HANDOFF_REQUIRED'), false);
  });
});

