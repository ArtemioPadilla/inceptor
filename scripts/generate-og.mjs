// Generate the Open Graph image (1200×630) used for social previews.
//
// Pure-SVG, then rasterize with sharp. No headless browser, no Satori,
// no React. Re-runnable as part of the build if assets become stale.

import sharp from 'sharp';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const logoSvg = readFileSync(resolve(root, 'public/icons/logo-source.svg'), 'utf-8');

// We'll inline the logo as data URI inside the OG SVG so a single sharp call
// rasterizes the whole composition.
const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`;

const ogSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#050505"/>
      <stop offset="1" stop-color="#0f1f1a"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#10b981" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <image href="${logoDataUri}" x="800" y="120" width="320" height="320"/>

  <g transform="translate(60, 70)">
    <rect rx="999" width="220" height="36" fill="#10b981" fill-opacity="0.12"
          stroke="#10b981" stroke-opacity="0.4" stroke-width="1"/>
    <circle cx="20" cy="18" r="5" fill="#34d399"/>
    <text x="35" y="23" font-family="ui-sans-serif, system-ui, sans-serif"
          font-size="14" fill="#a7f3d0" font-weight="600">
      Inceptor
    </text>
  </g>

  <text x="60" y="240" font-family="ui-sans-serif, system-ui, sans-serif"
        font-size="56" font-weight="800" fill="#f5f5f5" letter-spacing="-1">
    Ship faster.
  </text>
  <text x="60" y="310" font-family="ui-sans-serif, system-ui, sans-serif"
        font-size="56" font-weight="800" fill="#10b981" letter-spacing="-1">
    Ship principled.
  </text>

  <text x="60" y="380" font-family="ui-sans-serif, system-ui, sans-serif"
        font-size="22" fill="#a3a3a3" font-weight="500">
    Astro 5 · React 19 · shadcn/Base UI · TanStack · Tremor Raw · Motion · PWA
  </text>

  <g transform="translate(60, 440)">
    <text font-family="ui-monospace, monospace" font-size="18" fill="#d4d4d8">
      <tspan x="0" y="0">Shape Up cadence · TDD · Spec-DD · Ethics gate · /goal orchestration</tspan>
    </text>
  </g>

  <text x="60" y="580" font-family="ui-monospace, monospace"
        font-size="14" fill="#737373">
    github.com/ArtemioPadilla/inceptor
  </text>
</svg>`;

await sharp(Buffer.from(ogSvg))
  .png({ compressionLevel: 9 })
  .toFile(resolve(root, 'public/og-image.png'));

console.log('public/og-image.png generated (1200×630)');

writeFileSync(resolve(root, 'public/og-source.svg'), ogSvg);
console.log('public/og-source.svg saved');
