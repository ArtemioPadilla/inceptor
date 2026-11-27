#!/usr/bin/env node
// Brand kit: the logo as files that can leave the repo (trademark filing,
// print, press, app stores).
//
// Everything is derived from one symbol SVG and one wordmark, so the variants
// cannot drift from each other: colour, negative, one ink in black and in
// white; horizontal, stacked, symbol alone, wordmark alone. The wordmark is
// converted to outlines from the project's own display font, so no file needs
// a font installed.
//
//   npm run brand:kit            → brand-kit/<slug>-brand-kit/ and .zip
//   npm run brand:kit -- --pdf   → also brand-sheet.pdf (needs Playwright's Chromium)
//
// Input: brand-kit.config.json at the repo root. The symbol must be a flat
// SVG: literal fill/stroke attributes, no gradients, no <style>.
//
// A symbol whose shapes touch reads as a blob in one ink. `symbolOneInk` may
// point at a hand-tuned version; the build measures it against the version
// derived mechanically from the colour symbol and refuses it when the two
// differ by more than `oneInk.allowance` (default 5 % of the painted area).

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const COLOR_ATTR = /\b(fill|stroke|stop-color)="([^"]+)"/g;
const norm = (c) => c.trim().toLowerCase();
const r2 = (n) => Number(n.toFixed(2));

/** viewBox and inner markup of a flat SVG, root paint attributes kept on a group. */
export function parseSvg(svg) {
  const m = /<svg\b([^>]*)>([\s\S]*)<\/svg>/.exec(
    svg.replace(/<\?xml[^>]*\?>|<!--[\s\S]*?-->/g, ''),
  );
  if (!m) throw new Error('brand-kit: not an SVG document');
  if (/<style|Gradient|<pattern/.test(m[2]))
    throw new Error('brand-kit: the symbol must be flat (no <style>, gradients or patterns)');
  const vb = /viewBox="([^"]+)"/.exec(m[1]);
  if (!vb) throw new Error('brand-kit: the symbol needs a viewBox');
  const [x, y, w, h] = vb[1]
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const paint = (
    m[1].match(/\b(fill|stroke|stroke-width|stroke-linecap|stroke-linejoin)="[^"]+"/g) ?? []
  ).join(' ');
  return { x, y, w, h, inner: paint ? `<g ${paint}>${m[2].trim()}</g>` : m[2].trim() };
}

const doc = (p) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${p.x} ${p.y} ${p.w} ${p.h}">${p.inner}</svg>`;

/** Swap colours by exact value (case-insensitive). `map`: { from: to }. */
export function recolor(svg, map) {
  const table = Object.fromEntries(Object.entries(map).map(([k, v]) => [norm(k), v]));
  return svg.replace(COLOR_ATTR, (all, attr, value) =>
    norm(value) in table ? `${attr}="${table[norm(value)]}"` : all,
  );
}

let maskId = 0;
/**
 * The symbol in one ink. Colours in `drop` become cut-outs, in paint order
 * (a dropped shape drawn over an inked one makes a hole in it); every other
 * colour becomes `ink`.
 */
export function oneInk(svg, { ink = '#000000', drop = [] } = {}) {
  const p = parseSvg(svg);
  const dropped = new Set(drop.map(norm));
  let inner = p.inner.replace(COLOR_ATTR, (all, attr, value) =>
    norm(value) === 'none' ? all : `${attr}="${dropped.has(norm(value)) ? '#000' : '#fff'}"`,
  );
  // A shape with no fill attribute paints black: in a mask that would hide it.
  inner = `<g fill="#fff">${inner}</g>`;
  const id = `ink${++maskId}`;
  const box = `x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"`;
  return doc({
    ...p,
    inner: `<mask id="${id}" maskUnits="userSpaceOnUse" ${box}>${inner}</mask><rect ${box} fill="${ink}" mask="url(#${id})"/>`,
  });
}

/**
 * Share of the painted area where two one-ink drawings disagree (0 = same
 * silhouette). Both are rasterised at the same size and compared by coverage.
 */
export async function geometryDiff(svgA, svgB, size = 600) {
  const { default: sharp } = await import('sharp');
  const alpha = async (svg) => {
    const p = parseSvg(svg);
    return sharp(Buffer.from(svg), { density: (72 * size) / p.w })
      .resize({ width: size, height: Math.round((size * p.h) / p.w), fit: 'fill' })
      .ensureAlpha()
      .extractChannel('alpha')
      .raw()
      .toBuffer();
  };
  const [a, b] = await Promise.all([alpha(svgA), alpha(svgB)]);
  if (a.length !== b.length) return 1;
  let differ = 0;
  let painted = 0;
  for (let i = 0; i < a.length; i++) {
    const ia = a[i] > 127;
    const ib = b[i] > 127;
    if (ia || ib) painted++;
    if (ia !== ib) differ++;
  }
  return painted ? differ / painted : 0;
}

/**
 * Text as outlines. Sizes are in em: `width` and `capHeight` for layout, and
 * `svg(x, baseline, capSize, fill)` to place it with capitals `capSize` tall.
 */
export function wordmark(fontPath, text, { weight, tracking = 0 } = {}) {
  // Loaded here so importing this module (init.mjs does) needs no fontkit.
  const fontkit = requireFontkit();
  let font = fontkit.openSync(fontPath);
  if (weight && font.variationAxes?.wght) font = font.getVariation({ wght: weight });
  const em = font.unitsPerEm;
  const run = font.layout(text);
  let x = 0;
  const glyphs = run.glyphs.map((g, i) => {
    const pos = run.positions[i];
    const at = x + pos.xOffset;
    x += pos.xAdvance + tracking * em;
    return { d: g.path.toSVG(), at };
  });
  const width = (x - tracking * em) / em;
  const capHeight = (font.capHeight || font.ascent * 0.7) / em;
  return {
    width,
    capHeight,
    svg(left, baseline, capSize, fill) {
      const s = capSize / capHeight / em;
      const paths = glyphs
        .filter((g) => g.d)
        .map((g) => `<path transform="translate(${r2(g.at)} 0)" d="${g.d}"/>`)
        .join('');
      return `<g fill="${fill}" transform="translate(${r2(left)} ${r2(baseline)}) scale(${s} ${-s})">${paths}</g>`;
    },
    /** Advance width when capitals are `capSize` tall. */
    widthAt: (capSize) => (width * capSize) / capHeight,
  };
}

let fontkitModule;
function requireFontkit() {
  if (!fontkitModule) throw new Error('brand-kit: call loadFontkit() first');
  return fontkitModule;
}
async function loadFontkit() {
  fontkitModule ??= await import('fontkit');
  return fontkitModule;
}
// Synchronous callers (tests) get it resolved at import time when it is installed.
try {
  await loadFontkit();
} catch {
  /* reported by wordmark() when it is actually needed */
}

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** A plain zip (deflate, no dates) from `{ name, data }` entries. */
export function zip(entries) {
  const local = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const packed = deflateRawSync(data, { level: 9 });
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0);
    head.writeUInt16LE(20, 4);
    head.writeUInt16LE(0x0800, 6); // UTF-8 names
    head.writeUInt16LE(8, 8);
    head.writeUInt32LE(0x00210000, 10); // 1980-01-01: reproducible output
    head.writeUInt32LE(crc32(data), 14);
    head.writeUInt32LE(packed.length, 18);
    head.writeUInt32LE(data.length, 22);
    head.writeUInt16LE(nameBuf.length, 26);
    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4);
    head.copy(dir, 6, 4, 30); // version … name length
    dir.writeUInt32LE(offset, 42);
    local.push(head, nameBuf, packed);
    central.push(dir, nameBuf);
    offset += 30 + nameBuf.length + packed.length;
  }
  const dirSize = central.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(dirSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, ...central, end]);
}

/** brand-kit.config.json, with the symbol files read in. */
export function loadConfig(root) {
  const cfg = JSON.parse(readFileSync(join(root, 'brand-kit.config.json'), 'utf8'));
  cfg.symbolSvg = readFileSync(join(root, cfg.symbol), 'utf8');
  if (cfg.symbolOneInk) cfg.symbolOneInkSvg = readFileSync(join(root, cfg.symbolOneInk), 'utf8');
  return cfg;
}

const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const rgb = (hex) => {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16)).join(', ');
};

/**
 * Build the kit into `out`. Returns the paths written, relative to `out`.
 * Throws when a hand-tuned one-ink symbol drifted from the colour geometry.
 */
export async function buildKit(cfg, { root, out, pdf = false }) {
  const { default: sharp } = await import('sharp');
  await loadFontkit();
  const ink = cfg.ink ?? '#0a0a0a';
  const paper = cfg.paper ?? '#ffffff';
  const drop = cfg.oneInk?.drop ?? [];
  const allowance = cfg.oneInk?.allowance ?? 0.05;
  const notes = [...(cfg.notes ?? [])];

  // --- the four symbols, all from cfg.symbolSvg ---
  const derived = oneInk(cfg.symbolSvg, { ink: '#000000', drop });
  let oneInkSource = derived;
  if (cfg.symbolOneInkSvg) {
    const diff = await geometryDiff(derived, cfg.symbolOneInkSvg);
    if (diff > allowance)
      throw new Error(
        `brand-kit: the one-ink symbol differs from the colour symbol by ${(diff * 100).toFixed(1)} % of its area (allowed: ${(allowance * 100).toFixed(1)} %). Redraw it on the colour geometry, or raise oneInk.allowance on purpose.`,
      );
    oneInkSource = cfg.symbolOneInkSvg;
    notes.push(
      `The one-ink symbol is drawn by hand and differs from the colour symbol by ${(diff * 100).toFixed(1)} % of its area, so that touching shapes stay apart.`,
    );
  }
  const inkAll = (svg, color) =>
    svg.replace(COLOR_ATTR, (all, attr, value) =>
      norm(value) === 'none' ? all : `${attr}="${color}"`,
    );
  const symbols = {
    color: parseSvg(cfg.symbolSvg),
    negative: parseSvg(recolor(cfg.symbolSvg, cfg.negative ?? {})),
    'one-ink-black': parseSvg(
      oneInkSource === derived ? oneInk(cfg.symbolSvg, { ink, drop }) : inkAll(oneInkSource, ink),
    ),
    'one-ink-white': parseSvg(
      oneInkSource === derived
        ? oneInk(cfg.symbolSvg, { ink: paper, drop })
        : inkAll(oneInkSource, paper),
    ),
  };
  const textColor = { color: ink, negative: paper, 'one-ink-black': ink, 'one-ink-white': paper };
  const backdrop = { negative: ink, 'one-ink-white': ink };

  const word = wordmark(resolve(root, cfg.wordmark.font), cfg.wordmark.text, cfg.wordmark);

  // --- lockups, on a 100-unit-tall symbol ---
  const S = 100;
  const PAD = 10;
  const nest = (p, x, y, h) =>
    `<svg x="${r2(x)}" y="${r2(y)}" width="${r2((h * p.w) / p.h)}" height="${h}" viewBox="${p.x} ${p.y} ${p.w} ${p.h}">${p.inner}</svg>`;
  const page = (w, h, body, bg) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(w)} ${r2(h)}"><title>${esc(cfg.name)}</title>${bg ? `<rect width="${r2(w)}" height="${r2(h)}" fill="${bg}"/>` : ''}${body}</svg>\n`;

  const svgs = {};
  for (const [variant, p] of Object.entries(symbols)) {
    const symW = (S * p.w) / p.h;
    const bg = backdrop[variant];
    svgs[`symbol-${variant}`] = page(symW + PAD * 2, S + PAD * 2, nest(p, PAD, PAD, S), bg);
    {
      const cap = 36;
      const x = PAD + symW + 22;
      svgs[`logo-horizontal-${variant}`] = page(
        x + word.widthAt(cap) + PAD,
        S + PAD * 2,
        nest(p, PAD, PAD, S) + word.svg(x, PAD + S / 2 + cap / 2, cap, textColor[variant]),
        bg,
      );
    }
    {
      const cap = 22;
      const w = Math.max(symW, word.widthAt(cap)) + PAD * 2;
      svgs[`logo-stacked-${variant}`] = page(
        w,
        PAD + S + 18 + cap + PAD,
        nest(p, (w - symW) / 2, PAD, S) +
          word.svg((w - word.widthAt(cap)) / 2, PAD + S + 18 + cap, cap, textColor[variant]),
        bg,
      );
    }
  }
  svgs.wordmark = page(word.widthAt(36) + PAD * 2, 36 + PAD * 3, word.svg(PAD, PAD + 36, 36, ink));
  if (cfg.appIcon)
    svgs['app-icon'] = doc(parseSvg(readFileSync(join(root, cfg.appIcon), 'utf8'))) + '\n';

  // --- write ---
  const slug = `${slugify(cfg.name)}-brand-kit`;
  const kit = join(out, slug);
  rmSync(kit, { recursive: true, force: true });
  for (const d of ['svg', 'png', 'jpg']) mkdirSync(join(kit, d), { recursive: true });
  const written = [];
  const put = (rel, data) => {
    writeFileSync(join(kit, rel), data);
    written.push({
      name: `${slug}/${rel}`,
      data: Buffer.isBuffer(data) ? data : Buffer.from(data),
    });
  };

  for (const [name, svg] of Object.entries(svgs)) {
    put(`svg/${name}.svg`, svg);
    const src = Buffer.from(svg);
    const small = /^(symbol|app-icon)/.test(name);
    for (const width of small ? [512, 2000] : [1200, 3000])
      put(
        `png/${name}-${width}px.png`,
        await sharp(src, { density: 1200 }).resize({ width }).png().toBuffer(),
      );
    // What a filing or a printer asks for: square, white, 300 ppi.
    if (/(color|one-ink-black|^wordmark|^app-icon)/.test(name)) {
      const inner = await sharp(src, { density: 1200 })
        .resize({ width: 1500, height: 1500, fit: 'inside' })
        .png()
        .toBuffer();
      const jpg = await sharp({
        create: { width: 1800, height: 1800, channels: 3, background: '#ffffff' },
      })
        .composite([{ input: inner, gravity: 'centre' }])
        .withMetadata({ density: 300 })
        .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
        .toBuffer();
      put(`jpg/${name}-white-background.jpg`, jpg);
    }
  }

  const sheet = brandSheet(cfg, svgs, notes, { ink, backdrop });
  put('brand-sheet.html', sheet);
  if (pdf) {
    try {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch();
      const tab = await browser.newPage();
      await tab.goto(pathToFileURL(join(kit, 'brand-sheet.html')).href);
      put('brand-sheet.pdf', await tab.pdf({ format: 'A4', printBackground: true }));
      await browser.close();
    } catch (err) {
      console.warn(
        `brand-kit: no PDF (${err.message.split('\n')[0]}). Open brand-sheet.html and print it instead.`,
      );
    }
  }

  writeFileSync(join(out, `${slug}.zip`), zip(written));
  return [...written.map((f) => f.name), `${slug}.zip`];
}

function brandSheet(cfg, svgs, notes, { ink, backdrop }) {
  const img = (name, style) =>
    `<img alt="" style="${style}" src="data:image/svg+xml;base64,${Buffer.from(svgs[name]).toString('base64')}">`;
  const box = (name, label, style = 'width:100%') => {
    const variant = name.replace(/^(logo-horizontal|logo-stacked|symbol)-/, '');
    const dark = variant in backdrop;
    return `<figure${dark ? ` style="background:${ink};color:#ccc"` : ''}>${img(name, style)}<figcaption>${label}</figcaption></figure>`;
  };
  const variants = [
    ['color', 'Colour (primary version)'],
    ['negative', 'Negative'],
    ['one-ink-black', 'One ink'],
    ['one-ink-white', 'One ink, reversed'],
  ];
  const palette = (cfg.palette ?? [])
    .map(
      (c) =>
        `<tr><td class="sw" style="background:${c.hex}"></td><td>${esc(c.name)}</td><td>${c.hex.toUpperCase()}</td><td>${rgb(c.hex)}</td><td>${esc(c.use ?? '')}</td></tr>`,
    )
    .join('');
  const type = (cfg.type ?? [])
    .map(
      (t) =>
        `<tr><td>${esc(t.use)}</td><td>${esc(t.family)}</td><td>${esc(t.licence ?? '')}</td></tr>`,
    )
    .join('');
  return `<!doctype html>
<html lang="${esc(cfg.lang ?? 'en')}">
<meta charset="utf-8">
<title>${esc(cfg.name)}: brand sheet</title>
<style>
@page{size:A4;margin:16mm}
body{font-family:system-ui,"Helvetica Neue",Arial,sans-serif;font-size:10.5pt;line-height:1.45;color:#111;margin:0 auto;max-width:180mm;padding:8mm 0}
h1{font-size:20pt;margin:0 0 12pt}h2{font-size:12.5pt;margin:18pt 0 6pt;padding-top:8pt;border-top:2px solid ${ink};break-after:avoid}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8pt}.four{grid-template-columns:repeat(4,1fr)}
figure{margin:0;border:1px solid #ccc;padding:10pt;text-align:center;break-inside:avoid}figcaption{font-size:8.5pt;margin-top:4pt}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:4pt 6pt;text-align:left;font-size:9.5pt}th{background:#f4f4f4}
.sw{width:15%;height:34pt}tr{break-inside:avoid}li{margin-bottom:3pt}
</style>
<h1>${esc(cfg.name)}: brand sheet</h1>
<h2>Logo</h2>
<div class="grid">${variants.map(([v, l]) => box(`logo-horizontal-${v}`, `Horizontal · ${l}`)).join('')}${box('logo-stacked-color', 'Stacked · Colour', 'height:90pt')}${box('logo-stacked-one-ink-black', 'Stacked · One ink', 'height:90pt')}</div>
<h2>Symbol</h2>
<div class="grid four">${variants.map(([v, l]) => box(`symbol-${v}`, l, 'height:70pt')).join('')}</div>
${svgs['app-icon'] ? `<h2>App icon</h2><div class="grid four">${box('app-icon', 'Favicon and app icon', 'height:70pt')}</div>` : ''}
<h2>Differences by design</h2>
<ul>${notes.map((n) => `<li>${esc(n)}</li>`).join('') || '<li>None: every version is the same drawing.</li>'}</ul>
<h2>Colours</h2>
<table><tr><th></th><th>Name</th><th>HEX</th><th>RGB</th><th>Use</th></tr>${palette}</table>
<h2>Type</h2>
<table><tr><th>Use</th><th>Family</th><th>Licence</th></tr>${type}</table>
<p>The lettering in every file is converted to outlines: no font needs to be installed.</p>
</html>
`;
}

// --- CLI ---
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const arg = (name) => {
    const i = process.argv.indexOf(name);
    return i > -1 ? process.argv[i + 1] : undefined;
  };
  const out = resolve(root, arg('--out') ?? 'brand-kit');
  mkdirSync(out, { recursive: true });
  try {
    const files = await buildKit(loadConfig(root), {
      root,
      out,
      pdf: process.argv.includes('--pdf'),
    });
    console.log(
      `brand-kit: ${files.length - 1} files in ${out}\n           ${join(out, files.at(-1))}`,
    );
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
