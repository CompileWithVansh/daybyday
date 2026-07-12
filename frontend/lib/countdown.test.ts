import { describe, it, expect } from "vitest";
import {
  startOfDay,
  daysBetween,
  calculateDaysRemaining,
  calculatePhotoPosition,
} from "./countdown";

describe("startOfDay", () => {
  it("strips time to midnight", () => {
    const date = new Date("2025-06-15T14:30:45.123Z");
    const result = startOfDay(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it("does not mutate the original date", () => {
    const date = new Date("2025-06-15T14:30:00.000Z");
    const original = date.getTime();
    startOfDay(date);
    expect(date.getTime()).toBe(original);
  });
});

describe("daysBetween", () => {
  it("returns 0 for the same date", () => {
    const date = new Date("2025-06-15T10:00:00");
    expect(daysBetween(date, date)).toBe(0);
  });

  it("returns positive for b after a", () => {
    const a = new Date("2025-06-10T00:00:00");
    const b = new Date("2025-06-15T00:00:00");
    expect(daysBetween(a, b)).toBe(5);
  });

  it("returns negative for b before a", () => {
    const a = new Date("2025-06-15T00:00:00");
    const b = new Date("2025-06-10T00:00:00");
    expect(daysBetween(a, b)).toBe(-5);
  });

  it("ignores time components", () => {
    const a = new Date("2025-06-10T23:59:59");
    const b = new Date("2025-06-11T00:00:01");
    expect(daysBetween(a, b)).toBe(1);
  });
});

describe("calculateDaysRemaining", () => {
  it("returns days remaining for future meeting date", () => {
    const meeting = new Date("2025-06-20T00:00:00");
    const current = new Date("2025-06-15T00:00:00");
    expect(calculateDaysRemaining(meeting, current)).toBe(5);
  });

  it("returns 0 when meeting date is today", () => {
    const meeting = new Date("2025-06-15T00:00:00");
    const current = new Date("2025-06-15T12:00:00");
    expect(calculateDaysRemaining(meeting, current)).toBe(0);
  });

  it("returns 0 when meeting date is in the past", () => {
    const meeting = new Date("2025-06-10T00:00:00");
    const current = new Date("2025-06-15T00:00:00");
    expect(calculateDaysRemaining(meeting, current)).toBe(0);
  });

  it("never returns a negative number", () => {
    const meeting = new Date("2020-01-01T00:00:00");
    const current = new Date("2025-06-15T00:00:00");
    expect(calculateDaysRemaining(meeting, current)).toBe(0);
  });

  it("returns ceiling of partial day difference", () => {
    // Meeting is at noon on the 20th, current is start of day on 15th
    // diff = (noon 20th) - (midnight 15th) = 5.5 days → ceil = 6
    const meeting = new Date("2025-06-20T12:00:00");
    const current = new Date("2025-06-15T08:00:00");
    expect(calculateDaysRemaining(meeting, current)).toBe(6);
  });
});

describe("calculatePhotoPosition", () => {
  it("returns 0 when current equals start", () => {
    const start = new Date("2025-06-01T00:00:00");
    const meeting = new Date("2025-06-11T00:00:00");
    const current = new Date("2025-06-01T00:00:00");
    expect(calculatePhotoPosition(start, meeting, current)).toBe(0);
  });

  it("returns 1 when current equals meeting date", () => {
    const start = new Date("2025-06-01T00:00:00");
    const meeting = new Date("2025-06-11T00:00:00");
    const current = new Date("2025-06-11T00:00:00");
    expect(calculatePhotoPosition(start, meeting, current)).toBe(1);
  });

  it("returns 0.5 when halfway through", () => {
    const start = new Date("2025-06-01T00:00:00");
    const meeting = new Date("2025-06-11T00:00:00");
    const current = new Date("2025-06-06T00:00:00");
    expect(calculatePhotoPosition(start, meeting, current)).toBe(0.5);
  });

  it("clamps to 0 when current is before start", () => {
    const start = new Date("2025-06-10T00:00:00");
    const meeting = new Date("2025-06-20T00:00:00");
    const current = new Date("2025-06-05T00:00:00");
    expect(calculatePhotoPosition(start, meeting, current)).toBe(0);
  });

  it("clamps to 1 when current is after meeting", () => {
    const start = new Date("2025-06-01T00:00:00");
    const meeting = new Date("2025-06-11T00:00:00");
    const current = new Date("2025-06-20T00:00:00");
    expect(calculatePhotoPosition(start, meeting, current)).toBe(1);
  });

  it("always returns a value between 0 and 1", () => {
    const start = new Date("2025-06-01T00:00:00");
    const meeting = new Date("2025-06-11T00:00:00");
    const current = new Date("2025-06-06T12:00:00");
    const result = calculatePhotoPosition(start, meeting, current);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});
