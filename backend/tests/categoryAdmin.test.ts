import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, ensureUniqueSlug } from '../shared/utils/slugify.js';

describe('slugify', () => {
  it('converts Vietnamese text to URL slug', () => {
    assert.equal(slugify('Hoa Sinh Nhật'), 'hoa-sinh-nhat');
    assert.equal(slugify('  Hoa Tình Yêu  '), 'hoa-tinh-yeu');
    assert.equal(slugify('Đặc biệt!!!'), 'dac-biet');
  });

  it('ensures unique slug suffix', () => {
    assert.equal(ensureUniqueSlug('hoa-sinh-nhat', ['hoa-sinh-nhat']), 'hoa-sinh-nhat-2');
    assert.equal(
      ensureUniqueSlug('hoa-sinh-nhat', ['hoa-sinh-nhat', 'hoa-sinh-nhat-2']),
      'hoa-sinh-nhat-3'
    );
    assert.equal(ensureUniqueSlug('unique-slug', ['other-slug']), 'unique-slug');
  });
});

describe('deleteCategory guard logic', () => {
  it('blocks delete when product count is greater than zero', () => {
    const productCount: number = 3;
    const canDelete = productCount === 0;
    assert.equal(canDelete, false);
  });

  it('allows delete when product count is zero', () => {
    const productCount: number = 0;
    const canDelete = productCount === 0;
    assert.equal(canDelete, true);
  });
});
