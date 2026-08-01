/**
 * Shared surfaces for the app shell.
 *
 * Design language: Linear / Stripe / Raycast-inspired. Depth comes from
 * spacing, typography, borders, and layered shadows — never gradients or
 * glass. Every surface is a flat, warm-neutral or white fill.
 */

/** The page canvas behind chat and ledger content — warm neutral, not white. */
export const APP_SURFACE = '#F7F8FA';

/** Navigation panel — a hair lighter than the canvas so it reads as a distinct plane. */
export const SIDEBAR_SURFACE = '#FBFBFC';

/** Raised cards, panels, and modals — flat white. */
export const RAISED_SURFACE = '#FFFFFF';
export const CARD_SURFACE = '#FFFFFF';

/** Icon containers inside cards — a faint tint of the single accent, never a gradient. */
export const CHIP_SURFACE = '#EAF2FE';

/** Flat accent panel (e.g. Auth's branding side) — solid fill, no gradient. Sampled from the real brand assets, see index.css. */
export const ACCENT_SURFACE = '#015AEA';

/** Layered shadow scale — apply as inline style or via the shadow-vanta-* theme tokens. */
export const SHADOW_SM = '0 1px 2px rgba(17,24,39,0.03)';
export const SHADOW_MD = '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)';
export const SHADOW_LG = '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05), 0 30px 60px rgba(17,24,39,0.04)';
