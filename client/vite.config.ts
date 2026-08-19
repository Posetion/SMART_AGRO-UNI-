import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      disable: process.env.SMART_AGRO_SHARE === '1',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo-leaf.png'],
      manifest: {
        name: 'Smart Agro Community',
        short_name: 'SmartAgro',
        description: 'Agricultural community platform for Myanmar farmers',
        theme_color: '#1f4d3a',
        background_color: '#f3f6f2',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/logo-leaf.png',
            sizes: '235x235',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,png,woff2}'],
        globIgnores: ['**/knowledge/**'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        // Prefer IPv4 — Windows localhost can hang on ::1 vs 127.0.0.1 mismatch
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
});
