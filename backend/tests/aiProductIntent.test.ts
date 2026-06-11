import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  detectProductSearchIntent,
  detectProductSearchIntentFromHistory,
} from '../modules/ai/services/aiProductIntent.service.js';

describe('aiProductIntent', () => {
  it('detectProductSearchIntent splits style and short keyword', () => {
    const intent = detectProductSearchIntent('gợi ý hoa lãng mạn tầm 1.5tr');
    assert.ok(intent);
    assert.equal(intent?.keyword, 'hoa');
    assert.equal(intent?.filters?.style, 'lãng mạn');
    assert.equal(intent?.filters?.maxPrice, 1_500_000);
    assert.equal(intent?.occasionCategorySlug, 'hoa-tinh-yeu');
    assert.equal(intent?.isGeneralConsultation, false);
  });

  it('detectProductSearchIntentFromHistory keeps budget on gợi ý khác', () => {
    const intent = detectProductSearchIntentFromHistory([
      'tư vấn hoa lãng mạn 1tr5',
      'gợi ý khác',
    ]);
    assert.ok(intent);
    assert.equal(intent?.filters?.maxPrice, 1_500_000);
    assert.equal(intent?.filters?.style, 'lãng mạn');
  });

  it('general consultation uses default keyword', () => {
    const intent = detectProductSearchIntent('tư vấn hoa tươi');
    assert.ok(intent);
    assert.equal(intent?.keyword, 'hoa tươi');
    assert.equal(intent?.isGeneralConsultation, true);
  });

  it('does not classify store-info as product intent', () => {
    const intent = detectProductSearchIntent('cho mình xin địa chỉ shop ở đâu');
    assert.equal(intent, null);
  });

  it('keeps money span and ignores phone number in mixed message', () => {
    const intent = detectProductSearchIntent('số điện thoại 0901234567 và ngân sách 1tr5');
    assert.ok(intent);
    assert.equal(intent?.filters?.maxPrice, 1_500_000);
  });
});
