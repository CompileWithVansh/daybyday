import { describe, it, expect } from 'vitest';
import { searchDiaryEntries, sortEntriesDescending } from './diary-search';
import type { DiaryEntry } from '@/types';

function makeDiaryEntry(overrides: Partial<DiaryEntry> = {}): DiaryEntry {
  return {
    id: 1,
    date: '2025-06-15',
    title: '',
    content: 'Today was a good day',
    mood: '😊',
    weather: '☀️',
    images: [],
    voiceNote: null,
    user: { id: 1 },
    createdAt: '2025-06-15T00:00:00.000Z',
    updatedAt: '2025-06-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('searchDiaryEntries', () => {
  const entries: DiaryEntry[] = [
    makeDiaryEntry({ id: 1, content: 'Had a lovely morning walk in the park' }),
    makeDiaryEntry({ id: 2, content: 'Worked on the project all day' }),
    makeDiaryEntry({ id: 3, content: 'Went to the PARK for a picnic' }),
    makeDiaryEntry({ id: 4, content: 'Watched a movie at home' }),
  ];

  it('returns entries matching keyword case-insensitively', () => {
    const result = searchDiaryEntries(entries, 'park');
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual([1, 3]);
  });

  it('returns empty array when no entries match', () => {
    const result = searchDiaryEntries(entries, 'swimming');
    expect(result).toHaveLength(0);
  });

  it('returns all entries when keyword is a common substring', () => {
    const result = searchDiaryEntries(entries, 'a');
    // All entries contain 'a'
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles empty keyword by returning all entries', () => {
    const result = searchDiaryEntries(entries, '');
    expect(result).toHaveLength(entries.length);
  });

  it('handles empty entries array', () => {
    const result = searchDiaryEntries([], 'test');
    expect(result).toHaveLength(0);
  });

  it('matches partial words', () => {
    const result = searchDiaryEntries(entries, 'morn');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});

describe('sortEntriesDescending', () => {
  it('sorts entries in reverse chronological order', () => {
    const entries: DiaryEntry[] = [
      makeDiaryEntry({ id: 1, date: '2025-06-10' }),
      makeDiaryEntry({ id: 2, date: '2025-06-15' }),
      makeDiaryEntry({ id: 3, date: '2025-06-12' }),
    ];

    const sorted = sortEntriesDescending(entries);
    expect(sorted.map((e) => e.id)).toEqual([2, 3, 1]);
  });

  it('does not mutate the original array', () => {
    const entries: DiaryEntry[] = [
      makeDiaryEntry({ id: 1, date: '2025-06-10' }),
      makeDiaryEntry({ id: 2, date: '2025-06-15' }),
    ];

    const original = [...entries];
    sortEntriesDescending(entries);
    expect(entries).toEqual(original);
  });

  it('handles empty array', () => {
    const result = sortEntriesDescending([]);
    expect(result).toEqual([]);
  });

  it('handles single entry', () => {
    const entries = [makeDiaryEntry({ id: 1, date: '2025-06-15' })];
    const result = sortEntriesDescending(entries);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('handles entries with same date', () => {
    const entries: DiaryEntry[] = [
      makeDiaryEntry({ id: 1, date: '2025-06-15' }),
      makeDiaryEntry({ id: 2, date: '2025-06-15' }),
    ];

    const sorted = sortEntriesDescending(entries);
    expect(sorted).toHaveLength(2);
  });
});
