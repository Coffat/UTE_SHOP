import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildProductMongoFilter,
  productMatchesNormalizedTerms,
} from '../modules/catalog/services/productSearchQuery.service.js';

describe('productSearchQuery', () => {
  it('buildProductMongoFilter uses minifiedVariants.price for budget', () => {
    const filter = buildProductMongoFilter({ maxPrice: 1_500_000, status: 'ACTIVE' });
    assert.deepEqual(filter['minifiedVariants.price'], { $lte: 1_500_000 });
    assert.equal(filter.status, 'ACTIVE');
  });

  it('styleOnly does not stack with separate keyword clause', () => {
    const filter = buildProductMongoFilter({
      textSearch: { mode: 'styleOnly', style: 'lãng mạn' },
    });
    assert.ok(filter.$or);
    assert.equal(filter.$and, undefined);
  });

  it('productMatchesNormalizedTerms matches description without accents', () => {
    const product = {
      name: 'Bó Tulip',
      description: 'Mang theo sắc thu lãng mạn dịu ngọt',
      slug: 'bo-tulip',
    } as Parameters<typeof productMatchesNormalizedTerms>[0];
    assert.equal(productMatchesNormalizedTerms(product, ['lang man']), true);
  });
});
