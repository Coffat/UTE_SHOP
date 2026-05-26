import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { maskApiKey } from '../modules/admin/services/settings.service.js';

describe('maskApiKey', () => {
  it('masks middle segment and keeps prefix and suffix', () => {
    const masked = maskApiKey('ute_shop_live_89f8d3f3fa2847a6b772d84f79a33578');
    assert.equal(masked, 'ute_shop_live_****...3578');
    assert.ok(!masked.includes('89f8d3f3fa2847a6b772d84f79a33578'));
  });

  it('returns safe placeholder for short keys', () => {
    assert.equal(maskApiKey(''), 'ute_shop_live_****');
    assert.equal(maskApiKey('short'), 'ute_shop_live_****');
  });
});
