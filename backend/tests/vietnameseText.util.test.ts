import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  extractBudgetMaxFromText,
  normalizeVietnameseText,
  parseVndAmount,
} from '../modules/catalog/utils/vietnameseText.util.js';

describe('vietnameseText.util', () => {
  it('parseVndAmount handles 1tr5 and 1.5tr', () => {
    assert.equal(parseVndAmount('1tr5'), 1_500_000);
    assert.equal(parseVndAmount('1.5tr'), 1_500_000);
    assert.equal(parseVndAmount('1,5 triệu'), 1_500_000);
  });

  it('extractBudgetMaxFromText from natural phrases', () => {
    assert.equal(extractBudgetMaxFromText('hoa lãng mạn tầm 1.5tr'), 1_500_000);
    assert.equal(extractBudgetMaxFromText('dưới 1tr5'), 1_500_000);
  });

  it('normalizeVietnameseText removes accents', () => {
    assert.equal(normalizeVietnameseText('Lãng Mạn'), 'lang man');
  });
});
