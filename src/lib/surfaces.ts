/**
 * Shared surfaces for the app shell.
 *
 * Design language: calm, premium, minimal. Depth comes from spacing,
 * typography and hairline borders — never gradients or glass. Every
 * surface is a flat, neutral or white fill. Vanta blue is an accent only;
 * there is no giant flat-blue panel surface anymore (see Part 2 — Auth).
 */

/** The page canvas behind chat and ledger content — quiet neutral, not white. */
export const APP_SURFACE = '#F8F9FB';

/** Navigation panel — a hair off the canvas so it reads as a distinct, quiet plane. */
export const SIDEBAR_SURFACE = '#F5F6F8';

/** Raised cards, panels, and modals — flat white. */
export const RAISED_SURFACE = '#FFFFFF';
export const CARD_SURFACE = '#FFFFFF';

/** Icon containers inside cards — a faint tint of the single accent, never a gradient. */
export const CHIP_SURFACE = '#EEF4FF';

/** Layered shadow scale — apply as inline style or via the shadow-vanta-* theme tokens. Extremely subtle by design. */
export const SHADOW_SM = '0 1px 2px rgba(17,24,39,0.04)';
export const SHADOW_MD = '0 1px 2px rgba(17,24,39,0.04), 0 6px 16px rgba(17,24,39,0.04)';
export const SHADOW_LG = '0 1px 2px rgba(17,24,39,0.04), 0 12px 28px rgba(17,24,39,0.06)';
