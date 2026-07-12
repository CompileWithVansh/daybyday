'use client';

import { cn } from '@/lib/utils';

interface PinkButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

const variantStyles: Record<NonNullable<PinkButtonProps['variant']>, string> = {
  primary: 'bg-pink-500 text-white hover:bg-pink-600 active:bg-pink-700',
  secondary: 'bg-pink-100 text-pink-700 hover:bg-pink-200 active:bg-pink-300',
  ghost: 'text-pink-500 hover:bg-pink-50 active:bg-pink-100',
};

export function PinkButton({
  variant = 'primary',
  className,
  children,
  disabled,
  ...props
}: PinkButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300',
        variantStyles[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
