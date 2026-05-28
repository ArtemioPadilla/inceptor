# Deploy

This scaffold ships static HTML + a service worker. Any free static host works.

The default is **GitHub Pages** via the workflow at
`.github/workflows/deploy.yml`. To enable: go to your repo's Settings → Pages
→ Source: "GitHub Actions". Pushes to `main` deploy automatically.

For other targets:

- [Cloudflare Pages](./cloudflare-pages.md) — fastest CDN; custom domain free
- [Netlify](./netlify.md) — best PR-preview UX; free contact form
- [Vercel](./vercel.md) — best Astro detection; hobby tier non-commercial

## Things you must change before going live

1. **`astro.config.mjs` `site:`** — replace the placeholder URL with your
   actual deployed domain. The sitemap and OG meta tags use it.
2. **`SECURITY.md`** — update the contact line with your email or kept-private channel.
3. **`public/og-source.svg` footer text** — change the GitHub URL if you forked.
4. **PWA icon brand** — `public/icons/logo-source.svg` is a generic 3-node
   loop in emerald. Replace with your real artwork, then run
   `node scripts/generate-og.mjs` to regenerate the OG image to match.

## Things you can change later

- Custom domain (each host handles this differently; see individual guides)
- Analytics — wire to Plausible / Umami / etc. The scaffold ships no analytics
- Cookie banner — none needed for an analytics-free static site
