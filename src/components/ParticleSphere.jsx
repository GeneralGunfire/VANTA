import { useEffect, useRef } from "react";

// 3D point-cloud sphere rendered on canvas: Fibonacci-distributed points,
// slow Y-rotation with a fixed viewing tilt, organic wave deformation of the
// radius, and depth-based brightness/size so the front face reads brighter.
export default function ParticleSphere({ size = 340 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const POINTS = 2800;
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < POINTS; i++) {
      const y = 1 - (i / (POINTS - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const th = golden * i;
      pts.push({
        x: Math.cos(th) * r,
        y,
        z: Math.sin(th) * r,
        lon: Math.atan2(Math.sin(th) * r, Math.cos(th) * r),
        lat: Math.asin(y),
      });
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const R = (size / 2 - 16) * dpr;
    const tiltX = -0.38;
    const cosX = Math.cos(tiltX);
    const sinX = Math.sin(tiltX);

    let raf;
    const start = performance.now();

    function drawFrame(now) {
      const t = reduceMotion ? 0 : (now - start) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const rotY = t * 0.16;
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      for (const p of pts) {
        // lumpy surface: two slow interfering waves over lon/lat
        const wob =
          1 +
          0.075 * Math.sin(3 * p.lon + t * 0.8) * Math.cos(2.3 * p.lat + t * 0.6) +
          0.04 * Math.sin(5 * p.lat + t * 0.5);

        const x = p.x * wob;
        const y = p.y * wob;
        const z = p.z * wob;

        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y1 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const depth = (1 - z2) / 2; // 1 = front, 0 = back
        const persp = 1 / (1 + z2 * 0.28);
        const sx = cx + x1 * R * persp;
        const sy = cy + y1 * R * persp;

        const alpha = 0.12 + 0.75 * depth * depth;
        const dotSize = (0.55 + 1.15 * depth) * dpr;

        // deeper accent blue on raised lumps and the front face, paler tint elsewhere
        const bright = Math.min(1, Math.max(0, 0.25 + depth * 0.6 + (wob - 1) * 3.2));
        // interpolate between the light tint (#E8F0FA) and the strong shade (#153F78)
        const r = Math.round(232 - 211 * bright);
        const g = Math.round(240 - 177 * bright);
        const b = Math.round(250 - 130 * bright);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) raf = requestAnimationFrame(drawFrame);
    }

    raf = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <div className="particle-sphere" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      <div className="sphere-mic" aria-hidden="true">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </div>
    </div>
  );
}
