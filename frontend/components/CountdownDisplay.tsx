'use client';

interface CountdownDisplayProps {
  daysRemaining: number;
}

export function CountdownDisplay({ daysRemaining }: CountdownDisplayProps) {
  if (daysRemaining === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-7xl sm:text-8xl font-bold text-pink-500 mb-2">🎉</p>
        <p className="text-2xl font-bold text-pink-700">
          Finally we are together
        </p>
        <p className="text-sm text-pink-400 mt-1">It&apos;s our day 💕</p>
      </div>
    );
  }

  return (
    <div className="text-center py-6">
      <p className="text-7xl sm:text-8xl font-bold text-pink-500 mb-1">{daysRemaining}</p>
      <p className="text-lg sm:text-xl font-semibold text-pink-700">
        {daysRemaining === 1 ? 'Day Left' : 'Days Left'} ❤️
      </p>
      <p className="text-xs text-pink-400 mt-2">until we meet again</p>
    </div>
  );
}
