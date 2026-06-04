import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parsePass1Decision } from '../modules/ai/tools/toolParser.js';
import { executeToolFromDecision } from '../modules/ai/tools/toolRegistry.js';
import { getCustomerOrderStatusByCode } from '../modules/order/services/order.service.js';
import Order from '../modules/order/models/Order.js';

describe('ai tool calling protocol parser', () => {
  it('parses strict tool_call json', () => {
    const parsed = parsePass1Decision(
      JSON.stringify({
        type: 'tool_call',
        toolName: 'searchProducts',
        arguments: { keyword: 'hoa hồng' },
      })
    );
    assert.equal(parsed.ok, true);
    assert.equal(parsed.decision?.type, 'tool_call');
    assert.equal(parsed.strategy, 'strict_json');
  });

  it('parses first json object from mixed output', () => {
    const parsed = parsePass1Decision(
      'Output:\n{"type":"handoff","reason":"customer_requested_staff"}\nDone'
    );
    assert.equal(parsed.ok, true);
    assert.equal(parsed.strategy, 'first_object');
    assert.equal(parsed.decision?.type, 'handoff');
  });

  it('rejects malformed payload', () => {
    const parsed = parsePass1Decision('tool call please');
    assert.equal(parsed.ok, false);
    assert.equal(parsed.strategy, 'invalid');
  });
});

describe('ai tool argument safety', () => {
  const context = {
    actorId: '6a217023080f8dc7563bfdc7',
    actorRole: 'CUSTOMER',
    conversationId: '6a2170478c96409b59a887e4',
    messageId: '6a217156b0d7cedbb2506cca',
  };

  it('rejects model-supplied identity fields in tool arguments', async () => {
    const result = await executeToolFromDecision(
      {
        type: 'tool_call',
        toolName: 'searchProducts',
        arguments: {
          keyword: 'hoa',
          customerId: 'malicious',
        },
      },
      context
    );

    assert.equal(result.status, 'INVALID_REQUEST');
    assert.equal(result.errorCode, 'TOOL_ARGUMENT_INVALID');
  });
});

describe('checkOrderStatus ownership filter', () => {
  it('always scopes lookup by customer id from context', async () => {
    const originalFindOne = Order.findOne.bind(Order);
    let capturedFilter: Record<string, unknown> | null = null;

    (Order as any).findOne = (filter: Record<string, unknown>) => {
      capturedFilter = filter;
      return {
        select() {
          return {
            async lean() {
              return null;
            },
          };
        },
      };
    };

    try {
      await getCustomerOrderStatusByCode('customer_123', 'DH123');
    } finally {
      (Order as any).findOne = originalFindOne;
    }

    assert.ok(capturedFilter);
    const filter = capturedFilter as Record<string, unknown>;
    assert.equal(filter.customer, 'customer_123');
    assert.equal(filter.orderCode, 'DH123');
  });
});
