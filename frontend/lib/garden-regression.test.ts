import { describe, it, expect } from 'vitest';
import { CURATED_DAILY_QUESTIONS, generateDailyQuestion, getTodayDateIST } from './ai-question';
import { calculateDaysRemaining, calculatePhotoPosition } from './countdown';

describe('Our Little World & Garden Regression Suite', () => {
  it('preserves countdown arithmetic for meeting date without modification', () => {
    // Regression check: Meeting date Nov 4, 2026
    const meetingDate = new Date('2026-11-04T00:00:00');
    const simulatedDate = new Date('2026-10-11T00:00:00');
    const days = calculateDaysRemaining(meetingDate, simulatedDate);
    expect(days).toBe(24);

    const start = new Date('2026-08-01T00:00:00');
    const pos = calculatePhotoPosition(start, meetingDate, simulatedDate);
    expect(pos).toBeGreaterThan(0);
    expect(pos).toBeLessThan(1);
  });

  it('provides safe, curated couple questions for fallback when AI is unconfigured or offline', async () => {
    expect(CURATED_DAILY_QUESTIONS.length).toBeGreaterThanOrEqual(5);
    CURATED_DAILY_QUESTIONS.forEach((q) => {
      expect(q.question).toBeDefined();
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options.length).toBeLessThanOrEqual(3);
    });

    const daily = await generateDailyQuestion();
    expect(daily).toBeDefined();
    expect(daily.question.length).toBeGreaterThan(5);
    expect(daily.options.length).toBeGreaterThanOrEqual(2);
  });

  it('formats IST date consistently YYYY-MM-DD', () => {
    const todayIST = getTodayDateIST();
    expect(todayIST).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
