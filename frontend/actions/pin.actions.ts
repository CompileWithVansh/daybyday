'use server';

import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface ValidatePinResult {
  success: boolean;
  error?: string;
  data?: {
    valid: boolean;
    locked: boolean;
    lockExpiresAt: string | null;
  };
}

interface SetPinResult {
  success: boolean;
  error?: string;
}

interface CheckLockoutResult {
  success: boolean;
  error?: string;
  data?: {
    hasPin: boolean;
    locked: boolean;
    lockExpiresAt: string | null;
  };
}

/**
 * Validates a 4-digit PIN against the stored hash.
 * Manages failed attempts and lockout logic.
 */
export async function validatePin(pin: string): Promise<ValidatePinResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Check if currently locked out
    if (user.pinLockedUntil && new Date(user.pinLockedUntil).getTime() > Date.now()) {
      return {
        success: true,
        data: {
          valid: false,
          locked: true,
          lockExpiresAt: user.pinLockedUntil.toISOString(),
        },
      };
    }

    // If no pin set, cannot validate
    if (!user.diaryPin) {
      return { success: false, error: 'No PIN has been set' };
    }

    const valid = await bcrypt.compare(pin, user.diaryPin);

    if (valid) {
      // Reset failed attempts on successful validation
      await prisma.user.update({
        where: { id: user.id },
        data: { pinFailedAttempts: 0, pinLockedUntil: null },
      });

      return {
        success: true,
        data: { valid: true, locked: false, lockExpiresAt: null },
      };
    } else {
      // Increment failed attempts
      const newAttempts = user.pinFailedAttempts + 1;
      const updateData: { pinFailedAttempts: number; pinLockedUntil?: Date } = {
        pinFailedAttempts: newAttempts,
      };

      // Lock if max attempts reached
      if (newAttempts >= MAX_PIN_ATTEMPTS) {
        updateData.pinLockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      const locked = newAttempts >= MAX_PIN_ATTEMPTS;
      return {
        success: true,
        data: {
          valid: false,
          locked,
          lockExpiresAt: locked
            ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString()
            : null,
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Unable to validate PIN. Please try again.',
    };
  }
}

/**
 * Sets or changes the user's diary PIN.
 * currentPin is required when changing an existing PIN.
 */
export async function setPin(
  pin: string,
  currentPin?: string
): Promise<SetPinResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // If user already has a PIN, verify the current one first
    if (user.diaryPin && currentPin) {
      const valid = await bcrypt.compare(currentPin, user.diaryPin);
      if (!valid) {
        return { success: false, error: 'Current PIN is incorrect' };
      }
    } else if (user.diaryPin && !currentPin) {
      return { success: false, error: 'Current PIN is required to change PIN' };
    }

    // Hash and store the new PIN
    const hashedPin = await bcrypt.hash(pin, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        diaryPin: hashedPin,
        pinFailedAttempts: 0,
        pinLockedUntil: null,
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to set PIN. Please try again.',
    };
  }
}

/**
 * Checks the user's current PIN lockout state.
 * Returns whether a PIN is set, and lock status.
 */
export async function checkLockout(): Promise<CheckLockoutResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const hasPin = !!user.diaryPin;
    const lockExpiresAt = user.pinLockedUntil?.toISOString() || null;
    const locked = user.pinLockedUntil
      ? new Date(user.pinLockedUntil).getTime() > Date.now()
      : false;

    return {
      success: true,
      data: {
        hasPin,
        locked,
        lockExpiresAt: locked ? lockExpiresAt : null,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to check lockout status. Please try again.',
    };
  }
}
