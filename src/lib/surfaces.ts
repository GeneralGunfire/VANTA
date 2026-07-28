/**
 * Shared dark surfaces for the signed-in app shell.
 *
 * All three are the same blue-tinted charcoal ramp at different depths, so the
 * sidebar, canvas and raised cards stack readably without drifting apart.
 */

/** The page canvas behind chat and ledger content — the deepest surface. */
export const APP_SURFACE = 'linear-gradient(170deg, #050B14 0%, #03070E 55%, #010306 100%)';

/** Navigation panel — deliberately lighter than the canvas so the two read apart. */
export const SIDEBAR_SURFACE = 'linear-gradient(180deg, #0F1C31 0%, #0B1526 55%, #070D18 100%)';

/** Raised cards that should lift clearly off the canvas. */
export const RAISED_SURFACE = 'linear-gradient(155deg, #22334D 0%, #16243A 48%, #0C1524 100%)';

/** Soft blue wash dropped behind hero content so the canvas isn't a flat block. */
export const CANVAS_GLOW =
  'radial-gradient(ellipse 55% 40% at 50% 0%, rgba(30,90,168,0.14), transparent 70%)';
