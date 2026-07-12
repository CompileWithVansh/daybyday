import type { DiaryEntry } from '@/types';

/**
 * Filters diary entries by keyword (case-insensitive substring match).
 */
export function searchDiaryEntries(
  entries: DiaryEntry[],
  keyword: string
): DiaryEntry[] {
  const lower = keyword.toLowerCase();
  return entries.filter((entry) =>
    entry.content.toLowerCase().includes(lower)
  );
}

/**
 * Sorts diary entries in reverse chronological order.
 */
export function sortEntriesDescending(entries: DiaryEntry[]): DiaryEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
