import { describe, expect, it } from "vitest";

import {
  blurFor,
  DEFAULT_CARD_WIDTH,
  MARQUEE_GAP,
  marqueeDuration,
  MIDDLE_WIDTH,
  revealThresholds,
  SRC_SET_WIDTHS,
  srcSet,
} from "../src/lib/cert";

describe("blurFor", () => {
  it("fully reveals the strip at ratio 1", () => {
    expect(blurFor(1)).toBe(0);
    expect(blurFor(1, 20, 1)).toBe(0);
  });

  it("applies the curve: maxBlur * (1 - ratio^curve)", () => {
    expect(blurFor(0, 10, 2)).toBe(10);
    expect(blurFor(0.5, 10, 1)).toBeCloseTo(5);
    // Ratio 0.5^2 = 0.25 -> 10 * 0.75
    expect(blurFor(0.5, 10, 2)).toBeCloseTo(7.5);
    // ratio 0.5^0.5 ~ 0.707 -> 10 * 0.293
    expect(blurFor(0.5, 10, 0.5)).toBeCloseTo(2.928932, 4);
  });

  it("returns 0 when maxBlur is clamped off", () => {
    expect(blurFor(0.5, 0)).toBe(0);
    expect(blurFor(0.5, -1)).toBe(0);
  });

  it("never exceeds maxBlur", () => {
    for (let i = 0; i <= 100; i++) {
      const blur = blurFor(i / 100, 10, 2);
      expect(blur).toBeGreaterThanOrEqual(0);
      expect(blur).toBeLessThanOrEqual(10);
    }
  });
});

describe("marqueeDuration", () => {
  it("crawls the group width / speed, clamped to [20, 240]s", () => {
    const groupWidth = 3 * (DEFAULT_CARD_WIDTH + MARQUEE_GAP);
    const expected = groupWidth / 40;
    expect(marqueeDuration(3)).toBeCloseTo(expected);
  });

  it("clamps very long strips", () => {
    expect(marqueeDuration(1000)).toBe(240);
  });

  it("clamps very short strips to a floor", () => {
    expect(marqueeDuration(1, 340, 200)).toBe(20);
  });

  it("avoids division by zero on a zero speed", () => {
    // Speed is floored at 1; the resulting huge crawl is clamped to the cap.
    expect(marqueeDuration(3, 340, 0)).toBe(240);
  });
});

describe("srcSet", () => {
  it("emits one candidate per width, starting at the source prefix", () => {
    expect(srcSet("/img/cert1")).toBe(
      "/img/cert1-480.webp 480w, /img/cert1-680.webp 680w, /img/cert1-960.webp 960w",
    );
  });

  it("references the same widths the element uses", () => {
    const widths = srcSet("/img/cert1").matchAll(/(\d{3})w/g);
    const used = [...widths].map((m) => Number(m[1]));
    expect(used).toEqual(SRC_SET_WIDTHS);
  });

  it("deduplicates widths through MIDDLE_WIDTH", () => {
    expect(SRC_SET_WIDTHS).toContain(MIDDLE_WIDTH);
    expect(MIDDLE_WIDTH).toBe(680);
  });
});

describe("revealThresholds", () => {
  it("starts at 0 and ends inclusive at 1", () => {
    const steps = revealThresholds();
    expect(steps[0]).toBe(0);
    expect(steps[steps.length - 1]).toBe(1);
    expect(steps).toHaveLength(24);
  });

  it("respects a custom step count", () => {
    expect(revealThresholds(4)).toEqual([0, 1 / 3, 2 / 3, 1]);
  });
});