import type { WorkingHoursSchedule, DaySchedule } from '../../admin/models/StoreSettings.js';
import { DEFAULT_WORKING_HOURS_SCHEDULE } from '../../admin/models/StoreSettings.js';
import { getOrCreateSettings } from '../../admin/repositories/settings.repository.js';

export type { WorkingHoursSchedule, DaySchedule };

const DAY_NAMES: Array<keyof WorkingHoursSchedule> = [
  'sunday',    // 0
  'monday',    // 1
  'tuesday',   // 2
  'wednesday', // 3
  'thursday',  // 4
  'friday',    // 5
  'saturday',  // 6
];

/**
 * Parses an "HH:mm" string into total minutes since midnight.
 * Returns -1 if the format is invalid.
 */
const toMinutes = (time: string): number => {
  const parts = time.split(':');
  if (parts.length !== 2) return -1;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
};

/**
 * Checks whether the current moment falls within any enabled working-hours window.
 *
 * Uses Intl.DateTimeFormat with the provided IANA timezone to derive local
 * day-of-week and time — no external package required.
 */
export const isWithinWorkingHours = (
  schedule: WorkingHoursSchedule,
  timezoneIana: string
): boolean => {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezoneIana,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'short',
    });
  } catch {
    // Invalid timezone — fall back to always open so AI is never incorrectly blocked
    return true;
  }

  const now = new Date();
  const parts = formatter.formatToParts(now);

  const weekdayShort = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0';
  const minuteStr = parts.find((p) => p.type === 'minute')?.value ?? '0';

  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  // Handle "24:mm" which some implementations emit for midnight
  const currentMinutes = (hour === 24 ? 0 : hour) * 60 + minute;

  // Map short weekday name to JS day index (0 = Sunday)
  const SHORT_TO_DAY_INDEX: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const dayIndex = SHORT_TO_DAY_INDEX[weekdayShort] ?? -1;
  if (dayIndex < 0) return true; // unexpected format — fail open

  const dayKey = DAY_NAMES[dayIndex];
  const day: DaySchedule = schedule[dayKey];

  if (!day.enabled) return false;

  const openMinutes = toMinutes(day.open);
  const closeMinutes = toMinutes(day.close);

  if (openMinutes < 0 || closeMinutes < 0) return true; // bad config — fail open

  // Handle overnight schedules (e.g. 22:00–02:00) — not typical for a flower shop
  // but guard against accidental misconfiguration
  if (closeMinutes <= openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
};

/**
 * Loads schedule and timezone from the store settings document and evaluates
 * whether the shop is currently within working hours.
 *
 * Falls back to `true` (shop open) on any settings read failure to ensure
 * the AI is never silently blocked by a configuration error.
 */
export const isShopCurrentlyOpen = async (): Promise<boolean> => {
  try {
    const settings = await getOrCreateSettings();
    const schedule = settings.workingHoursSchedule ?? DEFAULT_WORKING_HOURS_SCHEDULE;
    const timezoneIana = settings.timezoneIana?.trim() || 'Asia/Ho_Chi_Minh';
    return isWithinWorkingHours(schedule, timezoneIana);
  } catch {
    return true;
  }
};

/**
 * Returns the customer-facing soft notice shown when the shop is outside
 * working hours and a handoff would otherwise be triggered.
 */
export const buildOutsideHoursHandoffMessage = (): string =>
  'Hiện shop đang ngoài giờ làm việc. Nhân viên sẽ hỗ trợ bạn ngay khi shop mở cửa trở lại. Trong lúc đó, mình vẫn có thể giúp bạn với thông tin sản phẩm và đơn hàng nhé.';
