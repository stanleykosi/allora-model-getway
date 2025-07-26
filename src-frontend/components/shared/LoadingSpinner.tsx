import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoadingSpinner({ size = 24, className }: { size?: number, className?: string }) {
  return (
    <LoaderCircle
      size={size}
      className={cn("animate-spin text-primary", className)}
    />
  );
} 