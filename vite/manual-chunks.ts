/**
 * Webpack/vite manual chunk grouping for the XMPP client's dependencies.
 *
 * Grouping keeps heavy libraries in their own chunk so the chat loader can
 * evaluate them in separate tasks — each task gets its own allowance in
 * Lighthouse's Total Blocking Time metric.
 */
const CHUNK_GROUPS: Array<{ name: string; markers: string[] }> = [
  {
    name: "strophe",
    markers: ["node_modules/strophe.js/"],
  },
  {
    name: "dompurify",
    markers: ["node_modules/dompurify/"],
  },
  {
    name: "sizzle",
    markers: ["node_modules/sizzle/"],
  },
  {
    name: "converse-lodash",
    markers: ["node_modules/lodash-es/"],
  },
  {
    name: "converse-skeletor",
    markers: ["node_modules/@converse/skeletor/"],
  },
  {
    name: "converse-small",
    markers: [
      "node_modules/dayjs/",
      "node_modules/localforage",
      "node_modules/pluggable.js/",
      "node_modules/libomemo.js/",
      "node_modules/filesize/",
      "node_modules/sprintf-js/",
      "node_modules/@converse/openpromise/",
      "node_modules/@converse/log/",
    ],
  },
];

/** Maps a module path to its chunk name, or `undefined` to keep the default. */
export function chunkFor(modulePath: string): string | undefined {
  for (const group of CHUNK_GROUPS) {
    if (group.markers.some((marker) => modulePath.includes(marker))) {
      return group.name;
    }
  }
  return undefined;
}