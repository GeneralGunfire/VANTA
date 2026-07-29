/**
 * Shared light surfaces for the signed-in app shell.
 *
 * Modeled on a soft grayscale marble/silk gradient — charcoal drifting into
 * pale stone, no blue tint. The sidebar, canvas and raised cards are the same
 * ramp at different depths so they stack readably without drifting apart.
 */

/** The page canvas behind chat and ledger content — smoky charcoal folding into pale stone. */
export const APP_SURFACE =
  'linear-gradient(165deg, #4B4E54 0%, #7C8086 22%, #A8ACB1 45%, #C7CACD 68%, #DDDFE1 100%)';

/** Navigation panel — a shade darker than the canvas so the two read apart. */
export const SIDEBAR_SURFACE = 'linear-gradient(180deg, #3A3D42 0%, #55585D 55%, #6E7176 100%)';

/** Raised cards that should lift clearly off the canvas. */
export const RAISED_SURFACE = '#FFFFFF';

/** Soft charcoal wash dropped behind hero content so the canvas isn't a flat block. */
export const CANVAS_GLOW =
  'radial-gradient(ellipse 60% 45% at 30% 0%, rgba(30,32,36,0.14), transparent 70%)';
