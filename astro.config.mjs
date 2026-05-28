import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import AstroPWA from '@vite-pwa/astro';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [
    // MDX for the /docs/* content collection — lets pages embed React components
    mdx(),
    react(),
    AstroPWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      includeAssets: ['favicon.svg', 'icons/pwa-512.svg'],
      manifest: {
        name: 'issue-driven-web-template',
        short_name: 'IDD Template',
        description:
          'Astro + React + shadcn + TanStack + Tremor Raw + Motion + PWA — issue-driven development scaffold',
        theme_color: '#10b981',
        background_color: '#0a0a0a',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/pwa-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            // "any maskable" tells browsers this icon is safe to mask
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Precache all static assets produced by the Astro build
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
        // Fall back to index for any navigation that doesn't match a static file
        navigateFallback: '/',
        // Never fall back for API routes — they must not serve the SPA shell
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // GitHub REST API — stale-while-revalidate so the dashboard works offline
            urlPattern: /^https:\/\/api\.github\.com\/.*$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'github-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      experimental: {
        // Ensures that directory URLs (e.g. /showcase/) are handled correctly
        // by the SW without 404-ing on trailing-slash variants
        directoryAndTrailingSlashHandler: true,
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
});
