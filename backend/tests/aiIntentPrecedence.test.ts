import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveIntentWithPrecedence } from '../modules/ai/services/aiIntentResolver.service.js';
import { isStoreInfoIntent } from '../modules/ai/services/aiStoreInfo.service.js';

const historyRows = [
  {
    senderType: 'customer',
    content: 'Mình muốn xem mẫu hoa cưới',
  },
] as any[];

// ---------------------------------------------------------------------------
// 1. Intent precedence
// ---------------------------------------------------------------------------

describe('ai intent precedence', () => {
  it('prioritizes store_info over product intent and keeps secondary intent', () => {
    const resolved = resolveIntentWithPrecedence('Shop ở đâu và có hoa dưới 1 triệu không?', historyRows);
    assert.equal(resolved.primaryIntent, 'store_info');
    assert.ok(resolved.secondaryIntents.includes('strong_product'));
  });

  it('prioritizes order_specific over store_info when order code present', () => {
    const resolved = resolveIntentWithPrecedence('Cho mình xem trạng thái đơn UTE25062026-0001-COD và địa chỉ shop', []);
    assert.equal(resolved.primaryIntent, 'order_specific');
    assert.equal(resolved.orderCode, 'UTE25062026-0001-COD');
    assert.ok(resolved.secondaryIntents.includes('store_info'));
  });

  it('product history followed by store-info question resolves to store_info, not product', () => {
    // Product intent in history should NOT cause store-info to be treated as product follow-up
    const resolved = resolveIntentWithPrecedence('Shop ở đâu?', historyRows);
    assert.equal(resolved.primaryIntent, 'store_info');
  });
});

// ---------------------------------------------------------------------------
// 2. isStoreInfoIntent — store-hours patterns (explicit tier)
// ---------------------------------------------------------------------------

describe('isStoreInfoIntent — explicit store-hours keywords', () => {
  const expectStoreInfo = (query: string) =>
    assert.ok(isStoreInfoIntent(query), `Expected store_info intent for: "${query}"`);

  it('mở cửa', () => expectStoreInfo('shop có mở cửa không?'));
  it('đóng cửa', () => expectStoreInfo('shop đóng cửa lúc nào?'));
  it('giờ làm việc', () => expectStoreInfo('giờ làm việc của shop thế nào?'));
  it('giờ hoạt động', () => expectStoreInfo('giờ hoạt động của cửa hàng'));
  it('lịch hoạt động', () => expectStoreInfo('lịch hoạt động shop'));
  it('opening hours', () => expectStoreInfo('what are the opening hours?'));
  it('business hours', () => expectStoreInfo('business hours please'));
  it('giờ mở cửa + shop context', () => expectStoreInfo('shop mấy giờ mở cửa?'));
});

// ---------------------------------------------------------------------------
// 3. isStoreInfoIntent — contextual "mấy giờ" near store words
// ---------------------------------------------------------------------------

describe('isStoreInfoIntent — contextual mấy giờ near store-context', () => {
  it('mấy giờ shop đóng cửa → store_info', () => {
    assert.ok(isStoreInfoIntent('mấy giờ shop đóng cửa?'));
  });

  it('shop mấy giờ → store_info (shop directly adjacent)', () => {
    assert.ok(isStoreInfoIntent('shop mấy giờ?'));
  });

  it('cửa hàng mở mấy giờ → store_info', () => {
    assert.ok(isStoreInfoIntent('cửa hàng mở mấy giờ?'));
  });
});

// ---------------------------------------------------------------------------
// 4. isStoreInfoIntent — false positives MUST NOT match (regression guard)
// ---------------------------------------------------------------------------

describe('isStoreInfoIntent — false positives must NOT match', () => {
  const expectNotStoreInfo = (query: string) =>
    assert.ok(!isStoreInfoIntent(query), `Expected NO store_info intent for: "${query}"`);

  it('standalone mấy giờ about delivery → not store_info', () =>
    expectNotStoreInfo('đơn của tôi mấy giờ giao?'));

  it('standalone mấy giờ about staff callback → not store_info', () =>
    expectNotStoreInfo('mấy giờ nhân viên gọi lại?'));

  it('order code + mấy giờ → not store_info', () =>
    expectNotStoreInfo('đơn DH123 mấy giờ tới?'));

  it('general time question → not store_info', () =>
    expectNotStoreInfo('hôm nay mấy ngày?'));

  it('phone number in order context not misread as hours', () =>
    expectNotStoreInfo('đơn UTE25062026-0999-VNPAY giao sau mấy ngày?'));
});

// ---------------------------------------------------------------------------
// 5. isStoreInfoIntent — address, phone, email patterns unchanged
// ---------------------------------------------------------------------------

describe('isStoreInfoIntent — address/phone/email (unchanged patterns)', () => {
  it('ở đâu → store_info', () => assert.ok(isStoreInfoIntent('shop ở đâu?')));
  it('địa chỉ → store_info', () => assert.ok(isStoreInfoIntent('địa chỉ cửa hàng')));
  it('hotline → store_info', () => assert.ok(isStoreInfoIntent('hotline shop là gì?')));
  it('email hỗ trợ → store_info', () => assert.ok(isStoreInfoIntent('email hỗ trợ của shop')));
  it('liên hệ shop → store_info', () => assert.ok(isStoreInfoIntent('liên hệ shop qua số nào?')));
});
