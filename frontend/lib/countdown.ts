// lib/countdown.ts

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/**
 * Gets the current date in IST timezone.
 */
export function nowIST(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + IST_OFFSET_MS);
}

/**
 * Strips time information from a Date, returning midnight of that day.
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calculates the number of whole days between two dates (ignoring time).
 * Returns positive if b is after a, negative if b is before a.
 */
export function daysBetween(a: Date, b: Date): number {
  const diffMs = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculates days remaining until meeting date.
 * Uses IST timezone to ensure consistent results regardless of server location.
 * Returns 0 if meeting date is today or in the past.
 */
export function calculateDaysRemaining(
  meetingDate: Date,
  currentDate: Date = nowIST()
): number {
  const diffDays = daysBetween(startOfDay(currentDate), startOfDay(meetingDate));
  return Math.max(0, diffDays);
}

/**
 * Calculates photo position as a percentage (0 = edges, 1 = center).
 * Proportional to elapsed days since countdown started.
 * Returns a value clamped to the [0, 1] range.
 */
export function calculatePhotoPosition(
  startDate: Date,
  meetingDate: Date,
  currentDate: Date = nowIST()
): number {
  const totalDays = Math.max(1, daysBetween(startDate, meetingDate));
  const elapsedDays = daysBetween(startDate, currentDate);
  return Math.min(1, Math.max(0, elapsedDays / totalDays));
}
