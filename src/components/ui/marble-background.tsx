import React from 'react';

/**
 * Grayscale marble/silk swirl backdrop — soft diagonal bands folding from
 * charcoal into pale stone, echoing brushed silk rather than a flat gradient.
 */
export function MarbleBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: '-15%',
          background:
            'linear-gradient(155deg, #45484D 0%, #6A6E73 20%, #93979C 38%, #B7BABE 55%, #D4D6D8 75%, #E7E8E9 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '-20%',
          background:
            'radial-gradient(ellipse 70% 40% at 15% 15%, rgba(255,255,255,0.35), transparent 55%), radial-gradient(ellipse 55% 35% at 85% 30%, rgba(20,20,22,0.25), transparent 60%), radial-gradient(ellipse 60% 45% at 30% 85%, rgba(255,255,255,0.28), transparent 60%)',
          mixBlendMode: 'soft-light',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.15) 42%, transparent 54%), linear-gradient(115deg, transparent 55%, rgba(0,0,0,0.12) 65%, transparent 76%)',
        }}
      />
    </div>
  );
}
