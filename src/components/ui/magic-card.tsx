import React, { useRef, useState } from 'react';
import { cn } from '../../lib/utils';

interface MagicCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  spotlightColor?: string;
}

/** Magic UI-style card: a radial spotlight follows the cursor across the border and surface. */
export const MagicCard = React.forwardRef<HTMLButtonElement, MagicCardProps>(
  ({ className, children, spotlightColor = 'rgba(143,188,234,0.35)', onMouseMove, ...props }, ref) => {
    const [pos, setPos] = useState({ x: 50, y: 50 });
    const [isHovering, setIsHovering] = useState(false);
    const localRef = useRef<HTMLButtonElement | null>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      const el = localRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setPos({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
      onMouseMove?.(e);
    };

    return (
      <button
        ref={(node) => {
          localRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={cn(
          'group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-left transition-colors duration-300 hover:border-white/20',
          className,
        )}
        {...props}
      >
        {/* Spotlight that tracks the cursor */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(220px circle at ${pos.x}% ${pos.y}%, ${spotlightColor}, transparent 65%)`,
            opacity: isHovering ? 1 : 0,
          }}
        />
        <span className="relative">{children}</span>
      </button>
    );
  },
);
MagicCard.displayName = 'MagicCard';
