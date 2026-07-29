import React from 'react';
import { cn } from '../../lib/utils';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  background?: string;
}

/** Magic UI-style shimmer button: a conic-gradient ring rotates behind a solid inner fill. */
export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  ({ className, children, shimmerColor = '#6EA8FF', background = '#0B0F1A', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'group relative inline-flex items-center justify-center overflow-hidden rounded-full p-[1.5px] transition-transform active:scale-[0.97]',
          className,
        )}
        style={{ background: `conic-gradient(from 0deg, transparent 0%, ${shimmerColor} 12%, transparent 24%)` }}
        {...props}
      >
        <span
          className="absolute inset-0 animate-[spin_2.4s_linear_infinite]"
          style={{ background: `conic-gradient(from 0deg, transparent 0%, ${shimmerColor} 12%, transparent 24%)` }}
        />
        <span
          className="relative flex h-full w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-colors"
          style={{ background }}
        >
          {children}
        </span>
      </button>
    );
  },
);
ShimmerButton.displayName = 'ShimmerButton';
