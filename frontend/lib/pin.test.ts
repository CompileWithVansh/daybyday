import { describe, it, expect } from 'vitest';
import {
  isLocked,
  processPinAttempt,
  PinState,
  MAX_ATTEMPTS,
  LOCKOUT_DURATION_MS,
} from './pin';

describe('isLocked', () => {
  it('returns false when lockedUntil is null', () => {
    const state: PinState = { failedAttempts: 0, lockedUntil: null };
    expect(isLocked(state)).toBe(false);
  });

  it('returns true when lockedUntil is in the future', () => {
    const future = new Date(Date.now() + 10000);
    const state: PinState = { failedAttempts: 0, lockedUntil: future };
    expect(isLocked(state)).toBe(true);
  });

  it('returns false when lockedUntil is in the past', () => {
    const past = new Date(Date.now() - 10000);
    const state: PinState = { failedAttempts: 0, lockedUntil: past };
    expect(isLocked(state)).toBe(false);
  });

  it('returns false when lockedUntil equals now', () => {
    const now = new Date();
    const state: PinState = { failedAttempts: 0, lockedUntil: now };
    expect(isLocked(state, now)).toBe(false);
  });
});

describe('processPinAttempt', () => {
  const now = new Date('2025-06-15T12:00:00.000Z');

  it('grants access and resets state on correct PIN', () => {
    const state: PinState = { failedAttempts: 2, lockedUntil: null };
    const result = processPinAttempt(state, true, now);
    expect(result.granted).toBe(true);
    expect(result.newState.failedAttempts).toBe(0);
    expect(result.newState.lockedUntil).toBeNull();
  });

  it('increments failedAttempts on incorrect PIN', () => {
    const state: PinState = { failedAttempts: 0, lockedUntil: null };
    const result = processPinAttempt(state, false, now);
    expect(result.granted).toBe(false);
    expect(result.newState.failedAttempts).toBe(1);
    expect(result.newState.lockedUntil).toBeNull();
  });

  it('locks after MAX_ATTEMPTS consecutive failures', () => {
    const state: PinState = { failedAttempts: MAX_ATTEMPTS - 1, lockedUntil: null };
    const result = processPinAttempt(state, false, now);
    expect(result.granted).toBe(false);
    expect(result.newState.failedAttempts).toBe(0);
    expect(result.newState.lockedUntil).not.toBeNull();
    expect(result.newState.lockedUntil!.getTime()).toBe(
      now.getTime() + LOCKOUT_DURATION_MS
    );
  });

  it('denies access when locked even with correct PIN', () => {
    const lockedUntil = new Date(now.getTime() + 10000);
    const state: PinState = { failedAttempts: 0, lockedUntil };
    const result = processPinAttempt(state, true, now);
    expect(result.granted).toBe(false);
    expect(result.newState).toBe(state); // state unchanged
  });

  it('denies access when locked with incorrect PIN', () => {
    const lockedUntil = new Date(now.getTime() + 10000);
    const state: PinState = { failedAttempts: 0, lockedUntil };
    const result = processPinAttempt(state, false, now);
    expect(result.granted).toBe(false);
    expect(result.newState).toBe(state); // state unchanged
  });

  it('allows attempt after lockout expires', () => {
    const pastLock = new Date(now.getTime() - 1000);
    const state: PinState = { failedAttempts: 0, lockedUntil: pastLock };
    const result = processPinAttempt(state, true, now);
    expect(result.granted).toBe(true);
    expect(result.newState.failedAttempts).toBe(0);
    expect(result.newState.lockedUntil).toBeNull();
  });

  it('three consecutive failures trigger lockout', () => {
    let state: PinState = { failedAttempts: 0, lockedUntil: null };

    // First failure
    const r1 = processPinAttempt(state, false, now);
    state = r1.newState;
    expect(r1.granted).toBe(false);
    expect(state.failedAttempts).toBe(1);

    // Second failure
    const r2 = processPinAttempt(state, false, now);
    state = r2.newState;
    expect(r2.granted).toBe(false);
    expect(state.failedAttempts).toBe(2);

    // Third failure → lockout
    const r3 = processPinAttempt(state, false, now);
    state = r3.newState;
    expect(r3.granted).toBe(false);
    expect(state.lockedUntil).not.toBeNull();
    expect(state.failedAttempts).toBe(0);
  });
});
