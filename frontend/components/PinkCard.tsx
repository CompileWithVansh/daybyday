import { cn } from '@/lib/utils';

interface PinkCardProps {
  children: React.ReactNode;
  className?: string;
}

export function PinkCard({ children, className }: PinkCardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-pink-100 rounded-xl shadow-sm p-6',
        className
      )}
    >
      {children}
    </div>
  );
}
