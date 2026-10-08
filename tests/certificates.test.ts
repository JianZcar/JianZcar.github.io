import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { CERTIFICATES } from "../src/data/certificates";

const SRC_SET_WIDTHS = [480, 680, 960];

describe("CERTIFICATES data", () => {
  it("is non-empty", () => {
    expect(CERTIFICATES.length).toBeGreaterThan(0);
  });

  it("every entry has a title and a unique image path", () => {
    const images = new Set<string>();
    for (const certificate of CERTIFICATES) {
      expect(certificate.title.trim().length).toBeGreaterThan(0);
      images.add(certificate.image);
    }
    expect(images.size).toBe(CERTIFICATES.length);
  });

  it("references a real asset file for every srcset width", () => {
    const publicDir = join(__dirname, "..", "public");
    const missing: string[] = [];

    for (const certificate of CERTIFICATES) {
      for (const width of SRC_SET_WIDTHS) {
        const file = `${certificate.image}-${width}.webp`;
        if (!existsSync(join(publicDir, file))) missing.push(file);
      }
    }

    expect(missing).toEqual([]);
  });
});