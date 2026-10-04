import { defineConfig } from 'vite';
import unocss from '@unocss/vite';

export default defineConfig({
  plugins: [unocss({ mode: 'shadow-dom' })],
  appType: 'spa',
  server: {
    port: 5173,
  },
});
