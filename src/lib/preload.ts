/**
 * Pure helpers for warming the browser cache of the chat client's chunks.
 * Extracted from the loader so the regex/URL logic can be unit-tested.
 */

/** Pulls `/assets/xyz.js` style paths out of an importmap-less bundle disk geometry. */
export function assetJsPaths(source: string): string[] {
  const matches = source.match(/(?:\/)?assets\/[\w.-]+\.js/g) ?? [];
  return [...new Set(matches)];
}

/**
 * Absolute modulepreload hrefs for the given chunk paths. Paths are already
 * absolute (`/assets/...`), so `baseURI` resolves them to full URLs.
 */
export function preloadHrefs(
  paths: string[],
  baseURI: string,
): string[] {
  return [...new Set(paths.map((path) => new URL(path, baseURI).href))];
}