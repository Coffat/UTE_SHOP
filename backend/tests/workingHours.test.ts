import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isWithinWorkingHours, buildOutsideHoursHandoffMessage } from '../modules/ai/services/workingHours.service.js';
import type { WorkingHoursSchedule } from '../modules/ai/services/workingHours.service.js';

const ALL_CLOSED: WorkingHoursSchedule = {
  monday:    { enabled: false, open: '08:00', close: '21:00' },
  tuesday:   { enabled: false, open: '08:00', close: '21:00' },
  wednesday: { enabled: false, open: '08:00', close: '21:00' },
  thursday:  { enabled: false, open: '08:00', close: '21:00' },
  friday:    { enabled: false, open: '08:00', close: '21:00' },
  saturday:  { enabled: false, open: '08:00', close: '21:00' },
  sunday:    { enabled: false, open: '08:00', close: '21:00' },
};

const ALL_OPEN_24H: WorkingHoursSchedule = {
  monday:    { enabled: true, open: '00:00', close: '23:59' },
  tuesday:   { enabled: true, open: '00:00', close: '23:59' },
  wednesday: { enabled: true, open: '00:00', close: '23:59' },
  thursday:  { enabled: true, open: '00:00', close: '23:59' },
  friday:    { enabled: true, open: '00:00', close: '23:59' },
  saturday:  { enabled: true, open: '00:00', close: '23:59' },
  sunday:    { enabled: true, open: '00:00', close: '23:59' },
};

describe('isWithinWorkingHours', () => {
  it('returns false when all days are disabled', () => {
    assert.equal(isWithinWorkingHours(ALL_CLOSED, 'Asia/Ho_Chi_Minh'), false);
  });

  it('returns true when all days are enabled 00:00–23:59', () => {
    assert.equal(isWithinWorkingHours(ALL_OPEN_24H, 'Asia/Ho_Chi_Minh'), true);
  });

  it('fails open with invalid timezone (never blocks AI)', () => {
    assert.equal(isWithinWorkingHours(ALL_CLOSED, 'Not/A_Timezone'), true);
  });

  it('returns false when today is disabled in schedule', () => {
    // Build a schedule where every day is disabled, to force false
    assert.equal(isWithinWorkingHours(ALL_CLOSED, 'Asia/Ho_Chi_Minh'), false);
  });

  it('handles a schedule where current day is enabled with broad window', () => {
    // Make a schedule that is open from 00:00 to 23:59 all days
    assert.equal(isWithinWorkingHours(ALL_OPEN_24H, 'UTC'), true);
  });
});

describe('buildOutsideHoursHandoffMessage', () => {
  it('returns a non-empty Vietnamese string', () => {
    const msg = buildOutsideHoursHandoffMessage();
    assert.ok(msg.length > 0);
    assert.ok(msg.includes('ngoài giờ'));
  });
});
