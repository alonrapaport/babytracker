import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Relative base so the built assets resolve from file:// inside the APK.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    // Needed to open the dev server from a phone on the same network.
    host: true,
  },
  build: {
    outDir: 'dist',
  },
});
