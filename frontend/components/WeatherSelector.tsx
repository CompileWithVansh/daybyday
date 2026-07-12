'use client';

import { cn } from '@/lib/utils';

const WEATHER_OPTIONS = ['☀️', '🌤️', '⛅', '🌧️', '⛈️', '🌨️', '🌫️', '🌈'];

interface WeatherSelectorProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function WeatherSelector({ value, onChange }: WeatherSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-pink-800">Weather</label>
      <div className="grid grid-cols-4 gap-2">
        {WEATHER_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={cn(
              'text-2xl p-2 rounded-lg transition-all duration-200 hover:scale-110',
              value === emoji
                ? 'ring-2 ring-pink-500 bg-pink-50 scale-110'
                : 'hover:bg-pink-50'
            )}
            aria-label={`Select weather ${emoji}`}
            aria-pressed={value === emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
