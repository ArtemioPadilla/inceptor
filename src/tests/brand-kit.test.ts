import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crc32 } from 'node:zlib';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  buildKit,
  geometryDiff,
  loadConfig,
  oneInk,
  recolor,
  wordmark,
  zip,
} from '../../scripts/brand-kit.mjs';

/**
 * #349: a logo has to leave the repo (trademark filing, print, press) as
 * files that agree with each other. The kit derives every variant from one
 * symbol and one wordmark, and proves the hand-tuned one-ink version did not
 * drift from the colour geometry: the mistake that reached a founder twice
 * when Buró del Pueblo's kit was assembled by hand.
 */
const ROOT = join(import.meta.dirname, '../..');
const FONT = 'node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2';

// A door ajar: frame, lit opening, leaf, handle. Leaf and frame touch, so a
// naive "paint everything in one ink" loses the drawing.
const DOOR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 108"><rect x="18" y="8" width="64" height="86" rx="6" fill="#d6006f"/><rect x="28" y="18" width="44" height="76" fill="#f2b705"/><path d="M28 18l30 9v73l-30-6z" fill="#0e0e10"/><rect x="46" y="56" width="6" height="10" rx="1" fill="#F2B705"/></svg>`;
// Hand-tuned one-ink door: same frame and opening, the leaf 2 units narrower
// on the hinge side so it separates from the frame.
const DOOR_TUNED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 108"><path d="M24 8h52a6 6 0 0 1 6 6v74a6 6 0 0 1-6 6h-4V18H28v76h-4a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6z" fill="#000"/><path fill-rule="evenodd" d="M30 18.6L58 27v73l-28-5.6zM46 57a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z" fill="#000"/></svg>`;
// The first attempt in Buró del Pueblo: a gap cut around the whole leaf, which
// also ate into the frame.
const DOOR_DRIFTED = DOOR_TUNED.replace('h-4V18H28v76h-4', 'h-4V15H24v79h0').replace(
  'M30 18.6L58 27v73l-28-5.6z',
  'M33 21L58 29v68l-25-5z',
);

describe('scripts/brand-kit.mjs: variants from one geometry', () => {
  it('recolor swaps declared colours, case-insensitively, and nothing else', () => {
    const out = recolor(DOOR, { '#0e0e10': '#ffffff', '#f2b705': '#ffcc00' });
    expect(out).not.toMatch(/#0e0e10|#f2b705/i);
    expect(out.match(/#ffcc00/g)).toHaveLength(2);
    expect(out).toContain('#d6006f');
  });

  it('oneInk keeps dropped colours as cut-outs and paints the rest in one ink', () => {
    const out = oneInk(DOOR, { ink: '#101010', drop: ['#f2b705'] });
    expect(out).toContain('<mask');
    expect(out).toContain('#101010');
    expect(out).not.toMatch(/#d6006f|#f2b705|#0e0e10/i);
  });

  it('measures no difference between a shape and itself', async () => {
    const a = oneInk(DOOR, { ink: '#000', drop: ['#f2b705'] });
    expect(await geometryDiff(a, a)).toBe(0);
  });

  it('accepts a hand-tuned one-ink symbol within a small allowance', async () => {
    const derived = oneInk(DOOR, { ink: '#000', drop: ['#f2b705'] });
    const diff = await geometryDiff(derived, DOOR_TUNED);
    expect(diff).toBeGreaterThan(0);
    expect(diff).toBeLessThan(0.03);
  });

  it('measures a drifted one-ink symbol well above that allowance', async () => {
    const derived = oneInk(DOOR, { ink: '#000', drop: ['#f2b705'] });
    expect(await geometryDiff(derived, DOOR_DRIFTED)).toBeGreaterThan(0.06);
  });
});

describe('scripts/brand-kit.mjs: wordmark and zip', () => {
  it('converts the wordmark to outlines: paths, no text, no font reference', () => {
    const w = wordmark(join(ROOT, FONT), 'Inceptor', { weight: 600 });
    const svg = w.svg(0, 100, 40, '#000');
    expect(w.width).toBeGreaterThan(2);
    expect(w.capHeight).toBeGreaterThan(0.5);
    expect(svg.match(/<path /g)?.length).toBe(8);
    expect(svg).not.toMatch(/<text|font-family/);
  });

  it('writes a zip any tool can list: one entry per file, correct CRC', () => {
    const data = Buffer.from('hola '.repeat(200));
    const z = zip([
      { name: 'a/uno.txt', data },
      { name: 'dos.txt', data: Buffer.from('x') },
    ]);
    expect(z.readUInt32LE(0)).toBe(0x04034b50);
    expect(z.readUInt32LE(14)).toBe(crc32(data));
    const eocd = z.length - 22;
    expect(z.readUInt32LE(eocd)).toBe(0x06054b50);
    expect(z.readUInt16LE(eocd + 10)).toBe(2);
    expect(z.length).toBeLessThan(data.length); // deflated
  });
});

describe('npm run brand:kit', () => {
  let out: string;
  let files: string[];
  beforeAll(async () => {
    out = mkdtempSync(join(tmpdir(), 'brand-kit-'));
    files = await buildKit(loadConfig(ROOT), { root: ROOT, out });
  }, 120_000);
  afterAll(() => rmSync(out, { recursive: true, force: true }));

  it('produces every lockup in every variant, as SVG, PNG and JPG, plus the sheet and the zip', () => {
    const kit = join(out, 'inceptor-brand-kit');
    const svgs = readdirSync(join(kit, 'svg'));
    for (const lockup of ['logo-horizontal', 'logo-stacked', 'symbol'])
      for (const variant of ['color', 'negative', 'one-ink-black', 'one-ink-white'])
        expect(svgs).toContain(`${lockup}-${variant}.svg`);
    expect(svgs).toContain('wordmark.svg');
    expect(readdirSync(join(kit, 'png')).length).toBe(svgs.length * 2);
    expect(readdirSync(join(kit, 'jpg'))).toContain('logo-horizontal-color-white-background.jpg');
    expect(existsSync(join(kit, 'brand-sheet.html'))).toBe(true);
    expect(existsSync(join(out, 'inceptor-brand-kit.zip'))).toBe(true);
    expect(files.length).toBeGreaterThan(30);
  });

  it('ships no live text: every SVG works without the font installed', () => {
    const dir = join(out, 'inceptor-brand-kit/svg');
    for (const f of readdirSync(dir))
      expect(readFileSync(join(dir, f), 'utf8'), f).not.toMatch(/<text|font-family/);
  });

  it('exports the JPGs square, on white, at print density', async () => {
    const meta = await sharp(
      join(out, 'inceptor-brand-kit/jpg/logo-horizontal-color-white-background.jpg'),
    ).metadata();
    expect([meta.width, meta.height, meta.density]).toEqual([1800, 1800, 300]);
  });

  it('the sheet names every palette colour and states the differences by design', () => {
    const cfg = loadConfig(ROOT);
    const html = readFileSync(join(out, 'inceptor-brand-kit/brand-sheet.html'), 'utf8');
    for (const c of cfg.palette) expect(html).toContain(c.hex.toUpperCase());
    for (const n of cfg.notes) expect(html).toContain(n);
    expect(html).not.toMatch(/https?:\/\//); // self-contained: opens offline
  });

  it('refuses a hand-tuned one-ink symbol that drifted from the colour geometry', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'brand-kit-drift-'));
    try {
      const cfg = { ...loadConfig(ROOT), symbolSvg: DOOR, symbolOneInkSvg: DOOR_DRIFTED };
      cfg.oneInk = { drop: ['#f2b705'] };
      await expect(buildKit(cfg, { root: ROOT, out: tmp })).rejects.toThrow(/one-ink.*differs/i);
      cfg.symbolOneInkSvg = DOOR_TUNED;
      await expect(buildKit(cfg, { root: ROOT, out: tmp })).resolves.toBeInstanceOf(Array);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }, 120_000);
});

describe('init.mjs: generated projects can build their own kit', () => {
  let out: string;
  beforeAll(() => {
    out = mkdtempSync(join(tmpdir(), 'init-brand-kit-'));
    execFileSync(
      'node',
      ['scripts/init.mjs', '--name', 'Casa Abierta', '--out', out, '--look', 'bold'],
      {
        cwd: ROOT,
        stdio: 'pipe',
      },
    );
  }, 60_000);
  afterAll(() => rmSync(out, { recursive: true, force: true }));

  it('copies the script, writes a config for the project and wires the command', () => {
    expect(existsSync(join(out, 'scripts/brand-kit.mjs'))).toBe(true);
    const cfg = JSON.parse(readFileSync(join(out, 'brand-kit.config.json'), 'utf8'));
    expect(cfg.name).toBe('Casa Abierta');
    expect(cfg.wordmark.text).toBe('Casa Abierta');
    expect(cfg.wordmark.font).toContain('bricolage-grotesque');
    expect(cfg.symbol).toBe('public/favicon.svg');
    const pkg = JSON.parse(readFileSync(join(out, 'package.json'), 'utf8'));
    expect(pkg.scripts['brand:kit']).toBe('node scripts/brand-kit.mjs');
    expect(Object.keys(pkg.devDependencies)).toEqual(expect.arrayContaining(['fontkit', 'sharp']));
    expect(readFileSync(join(out, '.gitignore'), 'utf8')).toMatch(/^brand-kit\/$/m);
  });
});
