// lib/countdown.ts

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
 * Returns the ceiling of the day difference, minimum 0.
 * Returns 0 if meeting date is today or in the past.
 */
export function calculateDaysRemaining(
  meetingDate: Date,
  currentDate: Date = new Date()
): number {
  const diffMs = meetingDate.getTime() - startOfDay(currentDate).getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
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
  currentDate: Date = new Date()
): number {
  const totalDays = Math.max(1, daysBetween(startDate, meetingDate));
  const elapsedDays = daysBetween(startDate, currentDate);
  return Math.min(1, Math.max(0, elapsedDays / totalDays));
}
