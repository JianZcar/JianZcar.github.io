/**
 * Pure helpers for the certificate section. Kept free of DOM/timing so they
 * can be unit-tested with node and reused by the `<sec-cert>` element.
 */

export const MARQUEE_GAP = 24;
export const DEFAULT_SPEED = 40;
export const DEFAULT_CARD_WIDTH = 340;
export const MIN_DURATION = 20;
export const MAX_DURATION = 240;
export const DEFAULT_MAX_BLUR = 10;
export const DEFAULT_BLUR_CURVE = 2;
export const OBSERVER_STEPS = 24;
export const SRC_SET_WIDTHS = [480, 680, 960] as const;
export const MIDDLE_WIDTH = SRC_SET_WIDTHS[1];

/**
 * Sharpness against vertical reveal. 1 fades linearly, 2 keeps the strip soft
 * until it is most of the way into view, 0.5 sharpens early.
 */
export function blurFor(
  ratio: number,
  maxBlur = DEFAULT_MAX_BLUR,
  curve = DEFAULT_BLUR_CURVE,
): number {
  if (ratio >= 1) return 0;
  if (maxBlur <= 0) return 0;
  return maxBlur * (1 - Math.pow(ratio, curve));
}

/**
 * Seconds for one full marquee loop. Clamped so a very short or long strip
 * still animates at a reasonable pace.
 */
export function marqueeDuration(
  certificateCount: number,
  cardWidth = DEFAULT_CARD_WIDTH,
  speed = DEFAULT_SPEED,
): number {
  const groupWidth = certificateCount * (cardWidth + MARQUEE_GAP);
  const seconds = groupWidth / Math.max(speed, 1);
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, seconds));
}

/**
 * The `srcset` string for a certificate image, e.g.
 * `/img/cert1-480.webp 480w, /img/cert1-680.webp 680w, /img/cert1-960.webp 960w`.
 */
export function srcSet(image: string): string {
  return SRC_SET_WIDTHS.map(
    (width) => `${image}-${width}.webp ${width}w`,
  ).join(", ");
}

/**
 * Observer thresholds for vertical reveal blur. The CSS transition absorbs
 * what is left between steps, so this only needs to be coarse enough to stay
 * cheap on scroll.
 */
export function revealThresholds(steps = OBSERVER_STEPS): number[] {
  return Array.from({ length: steps }, (_, i) => i / (steps - 1));
}