'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { validatePin, setPin } from '@/actions/pin.actions';
import { isLocked, processPinAttempt, PinState, MAX_ATTEMPTS } from '@/lib/pin';
import { cachePinHash, verifyOfflinePin, setPinVerifiedInSession } from '@/lib/offlineStorage';
import { PinkButton } from './PinkButton';

interface PinGateProps {
  onSuccess: () => void;
  hasPin: boolean;
}

export function PinGate({ onSuccess, hasPin }: PinGateProps) {
  const [pin, setLocalPin] = useState<string[]>(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState<string[]>(['', '', '', '']);
  const [isSetupMode, setIsSetupMode] = useState(!hasPin);
  const [isConfirmStep, setIsConfirmStep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [pinState, setPinState] = useState<PinState>({
    failedAttempts: 0,
    lockedUntil: null,
  });
  const [lockCountdown, setLockCountdown] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for lockout
  useEffect(() => {
    if (!pinState.lockedUntil) {
      setLockCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((pinState.lockedUntil!.getTime() - Date.now()) / 1000)
      );
      setLockCountdown(remaining);

      if (remaining <= 0) {
        setPinState({ failedAttempts: 0, lockedUntil: null });
        setError(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [pinState.lockedUntil]);

  const handleDigitChange = (
    index: number,
    value: string,
    isConfirm: boolean = false
  ) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1);

    if (isConfirm) {
      const newConfirmPin = [...confirmPin];
      newConfirmPin[index] = digit;
      setConfirmPin(newConfirmPin);

      // Auto-advance to next input
      if (digit && index < 3) {
        confirmInputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all 4 digits entered in confirm step
      if (digit && index === 3 && newConfirmPin.every((d) => d !== '')) {
        handleSetupConfirm(newConfirmPin);
      }
    } else {
      const newPin = [...pin];
      newPin[index] = digit;
      setLocalPin(newPin);

      // Auto-advance to next input
      if (digit && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all 4 digits entered
      if (digit && index === 3 && newPin.every((d) => d !== '')) {
        if (isSetupMode && !isConfirmStep) {
          // Move to confirm step
          setIsConfirmStep(true);
          setError(null);
          setTimeout(() => confirmInputRefs.current[0]?.focus(), 50);
        } else if (!isSetupMode) {
          handleValidate(newPin);
        }
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    isConfirm: boolean = false
  ) => {
    if (e.key === 'Backspace') {
      const currentArr = isConfirm ? confirmPin : pin;
      if (!currentArr[index] && index > 0) {
        const refs = isConfirm ? confirmInputRefs : inputRefs;
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handleValidate = useCallback(
    async (digits: string[]) => {
      const now = new Date();
      if (isLocked(pinState, now)) return;

      setIsLoading(true);
      setError(null);

      const pinString = digits.join('');

      // If offline, check against locally cached PIN hash
      if (typeof window !== 'undefined' && !navigator.onLine) {
        const isCorrectOffline = await verifyOfflinePin(pinString);
        if (isCorrectOffline) {
          setPinVerifiedInSession(true);
          onSuccess();
          setIsLoading(false);
          return;
        } else {
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setError('Incorrect PIN (Offline mode).');
          setLocalPin(['', '', '', '']);
          setTimeout(() => inputRefs.current[0]?.focus(), 100);
          setIsLoading(false);
          return;
        }
      }

      const result = await validatePin(pinString);

      if (!result.success) {
        // In case network dropped mid-request, try offline verification
        const isCorrectOffline = await verifyOfflinePin(pinString);
        if (isCorrectOffline) {
          setPinVerifiedInSession(true);
          onSuccess();
          setIsLoading(false);
          return;
        }

        setError(result.error || 'Validation failed');
        setIsLoading(false);
        return;
      }

      const isCorrect = result.data?.valid ?? false;
      const { newState, granted } = processPinAttempt(pinState, isCorrect, now);
      setPinState(newState);

      if (granted) {
        // Cache valid PIN hash for offline use and set session flag
        await cachePinHash(pinString);
        setPinVerifiedInSession(true);
        onSuccess();
      } else {
        // Trigger shake animation
        setShake(true);
        setTimeout(() => setShake(false), 500);

        if (result.data?.locked) {
          setError('Too many attempts. Please wait.');
        } else {
          const remaining = MAX_ATTEMPTS - newState.failedAttempts;
          setError(
            `Incorrect PIN. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          );
        }

        // Reset PIN inputs
        setLocalPin(['', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }

      setIsLoading(false);
    },
    [pinState, onSuccess]
  );

  const handleSetupConfirm = async (confirmDigits: string[]) => {
    const pinString = pin.join('');
    const confirmString = confirmDigits.join('');

    if (pinString !== confirmString) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setError('PINs do not match. Please try again.');
      setConfirmPin(['', '', '', '']);
      setIsConfirmStep(false);
      setLocalPin(['', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await setPin(pinString);

    if (result.success) {
      await cachePinHash(pinString);
      setPinVerifiedInSession(true);
      onSuccess();
    } else {
      setError(result.error || 'Failed to set PIN');
      setConfirmPin(['', '', '', '']);
      setIsConfirmStep(false);
      setLocalPin(['', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }

    setIsLoading(false);
  };

  const locked = isLocked(pinState);

  const renderPinInputs = (
    digits: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    isConfirm: boolean = false
  ) => (
    <div className={`flex gap-3 justify-center ${shake ? 'animate-shake' : ''}`}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { refs.current[index] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleDigitChange(index, e.target.value, isConfirm)}
          onKeyDown={(e) => handleKeyDown(index, e, isConfirm)}
          disabled={locked || isLoading}
          className={`
            w-14 h-14 text-center text-2xl font-bold rounded-lg border-2
            outline-none transition-all duration-200
            ${locked || isLoading ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : ''}
            ${!locked && !isLoading ? 'border-pink-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200' : ''}
          `}
          aria-label={`PIN digit ${index + 1}`}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-xl font-semibold text-pink-900">
            {isSetupMode
              ? isConfirmStep
                ? 'Confirm Your PIN'
                : 'Create Diary PIN'
              : 'Enter Diary PIN'}
          </h2>
          <p className="text-sm text-pink-600 mt-1">
            {isSetupMode
              ? isConfirmStep
                ? 'Enter the same 4-digit PIN to confirm'
                : 'Set a 4-digit PIN to protect your diary'
              : 'Enter your 4-digit PIN to access your diary'}
          </p>
        </div>

        {/* Lockout countdown */}
        {locked && (
          <div className="text-center mb-6 p-4 bg-pink-50 rounded-lg border border-pink-200">
            <p className="text-pink-700 font-medium">Access locked</p>
            <p className="text-2xl font-bold text-pink-600 mt-1">
              {lockCountdown}s
            </p>
            <p className="text-sm text-pink-500 mt-1">
              Please wait before trying again
            </p>
          </div>
        )}

        {/* PIN inputs */}
        {isSetupMode && isConfirmStep ? (
          renderPinInputs(confirmPin, confirmInputRefs, true)
        ) : (
          renderPinInputs(pin, inputRefs, false)
        )}

        {/* Error message */}
        {error && (
          <p className="text-center text-pink-600 text-sm mt-4 font-medium">
            {error}
          </p>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <p className="text-center text-pink-400 text-sm mt-4">
            Verifying...
          </p>
        )}

        {/* Setup mode back button */}
        {isSetupMode && isConfirmStep && (
          <div className="mt-6 text-center">
            <PinkButton
              variant="ghost"
              onClick={() => {
                setIsConfirmStep(false);
                setConfirmPin(['', '', '', '']);
                setLocalPin(['', '', '', '']);
                setError(null);
                setTimeout(() => inputRefs.current[0]?.focus(), 50);
              }}
            >
              Start Over
            </PinkButton>
          </div>
        )}
      </div>

      {/* Shake animation style */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
