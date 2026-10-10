import { fileURLToPath, URL } from "node:url";
import unocss from "@unocss/vite";
import { defineConfig } from "vite";

import { converseTaskYields } from "./vite/converse-task-yields.ts";
import { chunkFor } from "./vite/manual-chunks.ts";

export default defineConfig({
  plugins: [unocss({ mode: "shadow-dom" }), converseTaskYields()],
  resolve: {
    alias: [
      {
        find: /^@converse\/headless\/(.*)$/,
        replacement: fileURLToPath(
          new URL("./node_modules/@converse/headless/$1", import.meta.url),
        ),
      },
    ],
  },
  appType: "spa",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          return chunkFor(id);
        },
      },
    },
  },
  server: {
    port: 5173,
    allowedHosts: ["www.jianzcar.com.de"],
  },
});