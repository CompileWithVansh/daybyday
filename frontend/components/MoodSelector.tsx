'use client';

import { cn } from '@/lib/utils';

const MOODS = ['😊', '😢', '😍', '😤', '😴', '🤔', '😎', '🥰'];

interface MoodSelectorProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-pink-800">Mood</label>
      <div className="grid grid-cols-4 gap-2">
        {MOODS.map((emoji) => (
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
            aria-label={`Select mood ${emoji}`}
            aria-pressed={value === emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
