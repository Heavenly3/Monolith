import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// In development the dashboard runs on Vite and forwards API calls to
// `npm run api`, so both share one origin and the session cookie just works.
const api = process.env.API_URL ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5180,
    strictPort: true,
    proxy: {
      '/api': api,
      '/auth': api,
    },
  },
  build: { outDir: 'dist', emptyOutDir: true },
});
