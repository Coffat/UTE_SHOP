import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildDeterministicStoreInfoReply,
  extractRequestedStoreInfoFields,
  isStoreInfoIntent,
  type PublicStoreInfo,
} from '../modules/ai/services/aiStoreInfo.service.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fullStore: PublicStoreInfo = {
  storeName: 'UTESHOP',
  address: '1 Võ Văn Ngân, Thủ Đức',
  phone: '0901122333',
  supportEmail: 'support@uteshop.vn',
  openingHours: '08:00–20:00 (Thứ 2–Chủ nhật)',
};

const emptyStore: PublicStoreInfo = {
  storeName: '',
  address: '',
  phone: '',
  supportEmail: '',
  openingHours: '',
};

// ---------------------------------------------------------------------------
// 1. PublicStoreInfo DTO — storeName is data, not fallback
// ---------------------------------------------------------------------------

describe('PublicStoreInfo DTO contract', () => {
  it('storeName empty string when not configured — no silent fallback in DTO', () => {
    const reply = buildDeterministicStoreInfoReply(['address'], {
      ...fullStore,
      storeName: '',
      address: '123 Nguyễn Văn A',
    });
    // displayName falls back to 'shop' at presentation layer
    assert.ok(reply.content.includes('123 Nguyễn Văn A'));
    assert.ok(!reply.content.includes('undefined'));
    assert.ok(!reply.content.includes('null'));
  });

  it('storeName with data is used in address reply', () => {
    const reply = buildDeterministicStoreInfoReply(['address'], fullStore);
    assert.ok(reply.content.includes('UTESHOP'));
    assert.ok(reply.content.includes(fullStore.address));
  });
});

// ---------------------------------------------------------------------------
// 2. Single-field deterministic replies — behavior-based assertions
// ---------------------------------------------------------------------------

describe('single-field deterministic reply — tone and content', () => {
  it('address reply contains address value and shop name', () => {
    const reply = buildDeterministicStoreInfoReply(['address'], fullStore);
    assert.ok(reply.hasAnyData);
    assert.ok(reply.content.includes(fullStore.address));
    assert.ok(reply.content.includes('UTESHOP'));
    // Not a robot label:value format
    assert.ok(!reply.content.match(/^Địa chỉ cửa hàng:/));
    assert.ok(!reply.content.includes('theo dữ liệu hệ thống'));
    assert.ok(!reply.content.includes('chưa setup'));
  });

  it('address reply does not start with field label colon', () => {
    const reply = buildDeterministicStoreInfoReply(['address'], fullStore);
    assert.ok(!reply.content.startsWith('Địa chỉ cửa hàng:'));
  });

  it('address reply offers follow-up when phone or hours exist', () => {
    const reply = buildDeterministicStoreInfoReply(['address'], fullStore);
    // Offer follow-up since phone/openingHours are present
    assert.ok(reply.content.includes('giờ mở cửa') || reply.content.includes('liên hệ'));
  });

  it('address reply does not offer follow-up when no other info exists', () => {
    const reply = buildDeterministicStoreInfoReply(['address'], {
      ...emptyStore,
      storeName: 'UTESHOP',
      address: '1 Vo Van Ngan',
    });
    assert.ok(reply.hasAnyData);
    assert.ok(!reply.content.includes('giờ mở cửa'));
  });

  it('openingHours reply contains hours value, no "chưa cập nhật"', () => {
    const reply = buildDeterministicStoreInfoReply(['openingHours'], fullStore);
    assert.ok(reply.hasAnyData);
    assert.ok(reply.content.includes(fullStore.openingHours));
    assert.ok(!reply.content.includes('chưa cập nhật'));
    assert.ok(!reply.content.startsWith('Giờ mở cửa:'));
  });

  it('phone reply contains phone number', () => {
    const reply = buildDeterministicStoreInfoReply(['phone'], fullStore);
    assert.ok(reply.hasAnyData);
    assert.ok(reply.content.includes(fullStore.phone));
    assert.ok(!reply.content.startsWith('Hotline:'));
  });

  it('email reply contains email address', () => {
    const reply = buildDeterministicStoreInfoReply(['supportEmail'], fullStore);
    assert.ok(reply.hasAnyData);
    assert.ok(reply.content.includes(fullStore.supportEmail));
    assert.ok(!reply.content.startsWith('Email hỗ trợ:'));
  });
});

// ---------------------------------------------------------------------------
// 3. Missing-field behavior — per-field, not global fallback
// ---------------------------------------------------------------------------

describe('missing single field — natural fallback, not global escalation', () => {
  it('openingHours missing + phone present → mentions phone for contact', () => {
    const reply = buildDeterministicStoreInfoReply(['openingHours'], {
      ...emptyStore,
      phone: '0901122333',
    });
    assert.ok(!reply.hasAnyData);
    // Does not fabricate hours
    assert.ok(!reply.content.includes('08:00'));
    // Offers phone contact since it's available
    assert.ok(reply.content.includes('0901122333'));
    assert.ok(!reply.content.includes('chưa setup'));
  });

  it('openingHours missing + phone missing → staff contact suggestion', () => {
    const reply = buildDeterministicStoreInfoReply(['openingHours'], emptyStore);
    assert.ok(!reply.hasAnyData);
    assert.ok(reply.content.includes('nhân viên'));
    assert.ok(!reply.content.includes('chưa setup'));
    assert.ok(!reply.content.includes('08:00'));
  });

  it('address missing + phone present → offers phone fallback', () => {
    const reply = buildDeterministicStoreInfoReply(['address'], {
      ...emptyStore,
      phone: '0901122333',
    });
    assert.ok(!reply.hasAnyData);
    assert.ok(reply.content.includes('0901122333'));
    assert.ok(!reply.content.includes('undefined'));
  });

  it('address missing + phone missing → staff contact suggestion', () => {
    const reply = buildDeterministicStoreInfoReply(['address'], emptyStore);
    assert.ok(!reply.hasAnyData);
    assert.ok(reply.content.includes('nhân viên'));
  });
});

// ---------------------------------------------------------------------------
// 4. All-empty fallback
// ---------------------------------------------------------------------------

describe('all-empty fallback', () => {
  it('returns graceful fallback when all requested fields are empty', () => {
    const reply = buildDeterministicStoreInfoReply(
      ['address', 'phone', 'supportEmail', 'openingHours'],
      emptyStore
    );
    assert.ok(!reply.hasAnyData);
    assert.ok(reply.content.includes('nhân viên'));
    assert.ok(!reply.content.includes('chưa setup'));
    assert.ok(!reply.content.includes('undefined'));
  });

  it('resolved flags are all false for all-empty', () => {
    const reply = buildDeterministicStoreInfoReply(
      ['address', 'openingHours'],
      emptyStore
    );
    assert.equal(reply.resolved.address, false);
    assert.equal(reply.resolved.openingHours, false);
  });
});

// ---------------------------------------------------------------------------
// 5. Multi-field prose — no repeated "Dạ", natural composition
// ---------------------------------------------------------------------------

describe('multi-field deterministic reply', () => {
  it('address + openingHours: both present → merged into one sentence', () => {
    const reply = buildDeterministicStoreInfoReply(
      ['address', 'openingHours'],
      fullStore
    );
    assert.ok(reply.hasAnyData);
    assert.ok(reply.content.includes(fullStore.address));
    assert.ok(reply.content.includes(fullStore.openingHours));
    // Only one "Dạ" acknowledgement
    const dqCount = (reply.content.match(/\bDạ\b/gi) ?? []).length;
    assert.ok(dqCount <= 1, `Expected at most 1 "Dạ", got ${dqCount}`);
  });

  it('address + openingHours + phone all present → address/hours merged, phone as follow-up', () => {
    const reply = buildDeterministicStoreInfoReply(
      ['address', 'openingHours', 'phone'],
      fullStore
    );
    assert.ok(reply.content.includes(fullStore.address));
    assert.ok(reply.content.includes(fullStore.openingHours));
    assert.ok(reply.content.includes(fullStore.phone));
    const dqCount = (reply.content.match(/\bDạ\b/gi) ?? []).length;
    assert.ok(dqCount <= 1);
  });

  it('address present, openingHours missing, phone present → address shown, hours gap noted', () => {
    const storeWithGap: PublicStoreInfo = {
      ...fullStore,
      openingHours: '',
    };
    const reply = buildDeterministicStoreInfoReply(
      ['address', 'openingHours', 'phone'],
      storeWithGap
    );
    assert.ok(reply.hasAnyData);
    assert.ok(reply.content.includes(fullStore.address));
    assert.ok(reply.content.includes(fullStore.phone));
    // Missing openingHours mentioned inline
    assert.ok(reply.content.includes('giờ mở cửa'));
    assert.ok(reply.content.includes('chưa cập nhật'));
    // Does not invent hours
    assert.ok(!reply.content.includes('08:00'));
  });

  it('resolved flags accurate for partial multi-field', () => {
    const reply = buildDeterministicStoreInfoReply(
      ['address', 'openingHours'],
      { ...fullStore, openingHours: '' }
    );
    assert.equal(reply.resolved.address, true);
    assert.equal(reply.resolved.openingHours, false);
  });
});

// ---------------------------------------------------------------------------
// 6. Lifecycle A → B (settings update freshness)
// ---------------------------------------------------------------------------

describe('lifecycle: settings update A → B', () => {
  it('buildDeterministicStoreInfoReply reflects the latest PublicStoreInfo snapshot', () => {
    // Simulates: save openingHours = A, then save openingHours = B
    // Each AI request receives a fresh PublicStoreInfo from loadPublicStoreInfo().
    // This test verifies the builder uses whatever value is in the snapshot.
    const snapshotA: PublicStoreInfo = { ...fullStore, openingHours: '08:00–18:00' };
    const snapshotB: PublicStoreInfo = { ...fullStore, openingHours: '09:00–21:00 (Thứ 2–Thứ 7)' };

    const replyA = buildDeterministicStoreInfoReply(['openingHours'], snapshotA);
    assert.ok(replyA.content.includes('08:00–18:00'));
    assert.ok(!replyA.content.includes('09:00–21:00'));

    const replyB = buildDeterministicStoreInfoReply(['openingHours'], snapshotB);
    assert.ok(replyB.content.includes('09:00–21:00 (Thứ 2–Thứ 7)'));
    assert.ok(!replyB.content.includes('08:00–18:00'));
  });
});

// ---------------------------------------------------------------------------
// 7. Clear-value behavior (save openingHours = "")
// ---------------------------------------------------------------------------

describe('clear-value behavior: empty string clears the field', () => {
  it('empty openingHours shows chưa cập nhật, not old value', () => {
    const clearedStore: PublicStoreInfo = { ...fullStore, openingHours: '' };
    const reply = buildDeterministicStoreInfoReply(['openingHours'], clearedStore);
    assert.ok(!reply.hasAnyData);
    assert.ok(reply.content.includes('chưa cập nhật'));
    // Old value must not appear
    assert.ok(!reply.content.includes('08:00'));
  });
});

// ---------------------------------------------------------------------------
// 8. Tone invariants
// ---------------------------------------------------------------------------

describe('tone invariants', () => {
  it('no response starts with a raw field label colon', () => {
    const fields = ['address', 'openingHours', 'phone', 'supportEmail'] as const;
    const badPatterns = [/^Địa chỉ cửa hàng:/, /^Giờ mở cửa:/, /^Hotline:/, /^Email hỗ trợ:/];
    for (const field of fields) {
      const reply = buildDeterministicStoreInfoReply([field], fullStore);
      for (const pattern of badPatterns) {
        assert.ok(!pattern.test(reply.content), `Field ${field} reply starts with label:value format`);
      }
    }
  });

  it('no response contains forbidden phrases', () => {
    const forbiddenPhrases = [
      'theo dữ liệu hệ thống',
      'chưa setup',
      'lỗi hệ thống',
      'không lấy được dữ liệu',
    ];
    const allFields = ['address', 'openingHours', 'phone', 'supportEmail'] as const;
    for (const field of allFields) {
      const replyFull = buildDeterministicStoreInfoReply([field], fullStore);
      const replyEmpty = buildDeterministicStoreInfoReply([field], emptyStore);
      for (const phrase of forbiddenPhrases) {
        assert.ok(!replyFull.content.includes(phrase), `Full reply for ${field} contains "${phrase}"`);
        assert.ok(!replyEmpty.content.includes(phrase), `Empty reply for ${field} contains "${phrase}"`);
      }
    }
  });

  it('no fabricated data when field is empty', () => {
    const reply = buildDeterministicStoreInfoReply(['openingHours'], emptyStore);
    assert.ok(!reply.content.match(/\d{1,2}:\d{2}/)); // no time pattern
  });
});

// ---------------------------------------------------------------------------
// 9. extractRequestedStoreInfoFields — uses updated STORE_HOURS patterns
// ---------------------------------------------------------------------------

describe('extractRequestedStoreInfoFields', () => {
  it('shop ở đâu → address', () => {
    const fields = extractRequestedStoreInfoFields('shop ở đâu');
    assert.ok(fields.includes('address'));
  });

  it('giờ làm việc của shop → openingHours', () => {
    const fields = extractRequestedStoreInfoFields('giờ làm việc của shop');
    assert.ok(fields.includes('openingHours'));
  });

  it('shop mấy giờ mở cửa → openingHours', () => {
    const fields = extractRequestedStoreInfoFields('shop mấy giờ mở cửa');
    assert.ok(fields.includes('openingHours'));
  });

  it('shop ở đâu và mấy giờ đóng cửa → address + openingHours', () => {
    const fields = extractRequestedStoreInfoFields('shop ở đâu và mấy giờ đóng cửa');
    assert.ok(fields.includes('address'));
    assert.ok(fields.includes('openingHours'));
  });

  it('defaults to address + phone + email when no pattern matches', () => {
    const fields = extractRequestedStoreInfoFields('xin chào');
    assert.deepEqual(fields, ['address', 'phone', 'supportEmail']);
  });
});
