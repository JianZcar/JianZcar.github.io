import unocss from "@unocss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [unocss({ mode: "shadow-dom" })],
  appType: "spa",
  server: {
    port: 5173,
    allowedHosts: ["www.jianzcar.com.de"],
  },
});
