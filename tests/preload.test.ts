import { describe, expect, it } from "vitest";

import { assetJsPaths, preloadHrefs } from "../src/lib/preload";

describe("assetJsPaths", () => {
  it("finds every chunk reference in a built bundle", () => {
    const source = [
      `import x from "/assets/strophe-Df3_9xX.js";`,
      `import("/assets/dompurify-aB12_cd.js");`,
      `"lazy":"/assets/converse-small-xYz_9.0.js"`,
      `// assets/relative-hash-0.a1.js inside a comment`,
    ].join("\n");

    expect(assetJsPaths(source)).toContain("/assets/strophe-Df3_9xX.js");
    expect(assetJsPaths(source)).toContain("/assets/dompurify-aB12_cd.js");
    expect(assetJsPaths(source)).toContain("/assets/converse-small-xYz_9.0.js");
  });

  it("deduplicates repeated references", () => {
    const source = 'import "/assets/one-Tw1NjP.js"; import "/assets/one-Tw1NjP.js";';
    expect(assetJsPaths(source)).toHaveLength(1);
  });

  it("matches a leading-slash-less path (new URL tolerates it)", () => {
    expect(assetJsPaths(`assets/no-slashes-b2c3d4.js`)).toEqual([
      "assets/no-slashes-b2c3d4.js",
    ]);
  });

  it("returns an empty list when no chunks are referenced", () => {
    expect(assetJsPaths("plain text, no imports here")).toEqual([]);
  });
});

describe("preloadHrefs", () => {
  it("resolves absolute paths against the document base", () => {
    expect(preloadHrefs(["/assets/chunk-abc123.js"], "https://example.com/")).toEqual([
      "https://example.com/assets/chunk-abc123.js",
    ]);
  });

  it("resolves gracefully when the source omits the leading slash", () => {
    expect(preloadHrefs(["assets/chunk-abc123.js"], "https://example.com/")).toEqual([
      "https://example.com/assets/chunk-abc123.js",
    ]);
  });
});