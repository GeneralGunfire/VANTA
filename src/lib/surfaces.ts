/**
 * Shared surfaces for the app shell and marketing pages.
 *
 * Design system: white ground, near-black text, a single confident blue
 * accent (#1E5AA8) with a light tint (#E8F0FA) and dark shade (#153F78) for
 * emphasis states. No second accent color, no dark/charcoal theming —
 * every page in the product reads on the same light, calm surface.
 */

/** The page canvas behind chat and ledger content. Plain white — the product's ground truth. */
export const APP_SURFACE = '#FFFFFF';

/** Navigation panel — a hair off-white so it reads as a distinct plane from the canvas. */
export const SIDEBAR_SURFACE = '#F7F9FC';

/** Raised cards and modals. */
export const RAISED_SURFACE = '#FFFFFF';

/** The hero panel on Auth and the accent block on Landing — the one place the blue accent fills a large area. */
export const ACCENT_SURFACE = 'linear-gradient(155deg, #2E6EBF 0%, #1E5AA8 45%, #153F78 100%)';
