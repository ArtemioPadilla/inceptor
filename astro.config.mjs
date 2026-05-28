import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import AstroPWA from '@vite-pwa/astro';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Set this to your production URL for sitemap absolute URLs + Open Graph.
  // Replace when deploying — see ROADMAP Epic 6 (production readiness).
  site: 'https://issue-driven-web-template.example',
  // i18n routing — English at root (no prefix), Spanish under /es/.
  // `prefixDefaultLocale: false` keeps existing English URLs unchanged.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  // 301 redirects from the old top-level demo routes to their new /demos/*
  // locations. Old URLs survive; visual baselines re-anchor automatically.
  redirects: {
    '/dashboard': '/demos/dashboard',
    '/data': '/demos/data',
    '/data/large': '/demos/data/large',
    '/showcase': '/gallery',
  },
  integrations: [
    // MDX for the /docs/* content collection — lets pages embed React components
    mdx(),
    sitemap({
      // Don't bloat the sitemap with test artifacts or generated content
      filter: (page) =>
        !page.includes('/_') && !page.includes('/404') && !page.endsWith('.json'),
    }),
    react(),
    AstroPWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      includeAssets: [
        'favicon.svg',
        'favicon.ico',
        'apple-touch-icon.png',
        'icons/pwa-192.png',
        'icons/pwa-512.png',
        'icons/pwa-maskable-512.png',
        'icons/logo-source.svg',
      ],
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
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: '/icons/logo-source.svg', sizes: 'any', type: 'image/svg+xml' },
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
