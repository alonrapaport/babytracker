import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// VITE_OFFLINE_FILE=1 produces a file://-compatible build: classic IIFE
// script (module scripts are blocked on file:// URLs), dynamic imports
// inlined, no service worker — packaged into one HTML by
// scripts/build-offline.mjs so the app can be opened straight from a
// phone's storage with no hosting and no accounts.
const offlineFile = process.env.VITE_OFFLINE_FILE === '1';

// Relative base so the built assets work on GitHub Pages subpaths and inside a
// Capacitor shell (same convention as the babytracker app).
export default defineConfig({
  plugins: [
    react(),
    ...(offlineFile ? [] : [pwaPlugin()]),
  ],
  base: './',
  build: {
    outDir: offlineFile ? 'dist-offline' : 'dist',
    modulePreload: offlineFile ? false : undefined,
    rollupOptions: {
      maxParallelFileOps: 128,
      ...(offlineFile ? { output: { format: 'iife' as const, inlineDynamicImports: true } } : {}),
    },
  },
});

function pwaPlugin() {
  return VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      devOptions: { enabled: false },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      manifest: {
        name: 'RecipeBox',
        short_name: 'RecipeBox',
        description: 'Save recipes from anywhere, plan meals and shop smart.',
        lang: 'he',
        dir: 'rtl',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        theme_color: '#FBF7F2',
        background_color: '#FBF7F2',
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        // Android share-sheet -> installed PWA -> /#/import (params land in
        // location.search before the hash; consumed by consumeShareTarget()).
        share_target: {
          action: './',
          method: 'GET',
          params: { title: 'title', text: 'text', url: 'url' },
        },
      },
    });
}
