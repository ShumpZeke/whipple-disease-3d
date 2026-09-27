import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Static SPA. The WebGL stage is code-split with React.lazy so the 1907 opening
// renders before three.js has downloaded.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1400,
  },
  server: { port: 5173 },
  preview: { port: 4173 },
});
