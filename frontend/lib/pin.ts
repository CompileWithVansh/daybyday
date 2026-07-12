/**
 * Client-side PIN lockout state logic.
 * Manages failed attempts tracking and lockout duration.
 */

export interface PinState {
  failedAttempts: number;
  lockedUntil: Date | null;
}

export const MAX_ATTEMPTS = 3;
export const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds

/**
 * Determines if PIN access is currently locked.
 */
export function isLocked(state: PinState, now: Date = new Date()): boolean {
  if (!state.lockedUntil) return false;
  return now.getTime() < state.lockedUntil.getTime();
}

/**
 * Processes a PIN attempt. Returns updated state and whether access is granted.
 */
export function processPinAttempt(
  state: PinState,
  isCorrect: boolean,
  now: Date = new Date()
): { newState: PinState; granted: boolean } {
  if (isLocked(state, now)) {
    return { newState: state, granted: false };
  }

  if (isCorrect) {
    return {
      newState: { failedAttempts: 0, lockedUntil: null },
      granted: true,
    };
  }

  const newAttempts = state.failedAttempts + 1;
  if (newAttempts >= MAX_ATTEMPTS) {
    return {
      newState: {
        failedAttempts: 0,
        lockedUntil: new Date(now.getTime() + LOCKOUT_DURATION_MS),
      },
      granted: false,
    };
  }

  return {
    newState: { failedAttempts: newAttempts, lockedUntil: null },
    granted: false,
  };
}
