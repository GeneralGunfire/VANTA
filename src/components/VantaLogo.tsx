/**
 * The Vanta mark as native SVG — a squircle badge with a thick, two-tone
 * "V" built from solid rounded bars (not a thin stroke), each leg its own
 * gradient plus a soft inner highlight to read as dimensional rather than
 * flat. Renders crisp at any size/zoom/DPI, unlike a raster export. This
 * is an original vector interpretation of the brand mark, not a trace of
 * any generated image.
 */
export function VantaLogo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Vanta"
    >
      <rect width="32" height="32" rx="9" fill="url(#vanta-badge)" stroke="#E7E9EE" strokeWidth="0.5" />

      {/* Left leg — darker, deep navy to mid blue */}
      <rect
        x="13" y="8.5" width="6.2" height="14" rx="3.1"
        fill="url(#vanta-leg-left)"
        stroke="rgba(255,255,255,0.28)" strokeWidth="0.5"
        transform="rotate(-33 16.1 21.5)"
      />
      {/* Right leg — brighter, mid blue to light blue, drawn on top so the legs overlap like the reference mark */}
      <rect
        x="12.8" y="8.5" width="6.2" height="14" rx="3.1"
        fill="url(#vanta-leg-right)"
        stroke="rgba(255,255,255,0.35)" strokeWidth="0.5"
        transform="rotate(33 15.9 21.5)"
      />

      <defs>
        <linearGradient id="vanta-badge" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F5F6F8" />
        </linearGradient>
        <linearGradient id="vanta-leg-left" x1="13" y1="8.5" x2="19.2" y2="22.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#082C7A" />
          <stop offset="1" stopColor="#1261E8" />
        </linearGradient>
        <linearGradient id="vanta-leg-right" x1="19" y1="8.5" x2="12.8" y2="22.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1261E8" />
          <stop offset="1" stopColor="#5CA8FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
