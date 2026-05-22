import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveReportsPeriodRange } from '../modules/admin/repositories/reports.repository.js';

describe('resolveReportsPeriodRange', () => {
  it('returns 7-day window for period 7d', () => {
    const range = resolveReportsPeriodRange('7d');
    const diffMs = range.end.getTime() - range.start.getTime();
    const days = diffMs / (1000 * 60 * 60 * 24);
    assert.ok(days >= 6.9 && days <= 7.1);
    assert.ok(range.prevEnd.getTime() === range.start.getTime());
  });

  it('returns calendar month for period month', () => {
    const range = resolveReportsPeriodRange('month');
    assert.equal(range.start.getDate(), 1);
    assert.equal(range.start.getMonth(), range.end.getMonth());
    assert.equal(range.start.getFullYear(), range.end.getFullYear());
  });
});
