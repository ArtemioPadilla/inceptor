import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { accentHex, parseAccent, rebrandCss } from '../../scripts/accent.mjs';
import { parseAccentColor } from '@/lib/define-theme';

/**
 * #326: every generated project shipped the template's emerald (tokens,
 * favicon, theme-color), although define-theme.ts already derives a palette
 * from one accent colour. `--accent` re-brands at instantiation; the script
 * side lives in scripts/accent.mjs (plain ESM, init.mjs cannot import TS).
 */
const EMERALD_HUE = /oklch\(\s*[\d.]+\s+0\.\d+\s+16[3-5]\b/;
const ROSA = '#d6006f';

describe('scripts/accent.mjs', () => {
  it.each(['#d6006f', '#1e70c8', '#0a0', 'oklch(0.6 0.2 300)'])(
    'parses %s to the same hue as define-theme.ts (parity)',
    (color) => {
      expect(parseAccent(color).h).toBeCloseTo(parseAccentColor(color).h, 1);
    },
  );

  it('rejects what it cannot parse and colours with no hue', () => {
    expect(() => parseAccent('rosa')).toThrow(/accent/i);
    expect(() => parseAccent('#777777')).toThrow(/hue|chroma|gray|grey/i);
  });

  it('rebrandCss rotates the brand tokens and leaves neutrals and other hues alone', () => {
    const css = readFileSync('src/styles/global.css', 'utf8');
    const out = rebrandCss(css, parseAccent(ROSA).h);
    expect(out).not.toMatch(EMERALD_HUE);
    // Lightness and chroma are the vetted ones: only the hue moves.
    expect(out).toMatch(
      /--primary: light-dark\(oklch\(0\.50? 0\.123 [\d.]+\), oklch\(0\.78 0\.155 [\d.]+\)\)/,
    );
    // Neutrals, the destructive red and the other chart hues are untouched.
    expect(out).toContain('--background: light-dark(oklch(1 0 0), oklch(0.145 0 0));');
    expect(out).toContain('oklch(0.577 0.245 27.325)');
    expect(out).toContain('oklch(0.62 0.12 195)');
    // The hex scale follows the hue too.
    expect(out).not.toMatch(/#10b981|#34d399|#059669|#047857/i);
  });

  it('accentHex is the light primary as a hex, readable under white text', () => {
    const hex = accentHex(parseAccent(ROSA).h);
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
      number,
      number,
      number,
    ];
    const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    expect(1.05 / (L + 0.05)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('create-inceptor-app --accent', () => {
  let dir: string;
  const gen = (name: string, extra: string[]) => {
    const out = join(dir, name);
    execFileSync('node', ['scripts/init.mjs', '--name', name, '--out', out, ...extra], {
      stdio: 'pipe',
    });
    return (rel: string) => readFileSync(join(out, rel), 'utf8');
  };
  let rosa: (rel: string) => string;
  let plain: (rel: string) => string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'init-accent-'));
    rosa = gen('rosa-app', ['--accent', ROSA]);
    plain = gen('plain-app', []);
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('re-brands the tokens, the favicon and theme-color', () => {
    const hex = accentHex(parseAccent(ROSA).h);
    expect(rosa('src/styles/global.css')).not.toMatch(EMERALD_HUE);
    expect(rosa('public/favicon.svg')).toContain(`fill="${hex}"`);
    expect(rosa('src/layouts/BaseLayout.astro')).toContain(
      `<meta name="theme-color" content="${hex}" />`,
    );
    for (const rel of ['public/favicon.svg', 'src/layouts/BaseLayout.astro']) {
      expect(rosa(rel).toLowerCase(), rel).not.toContain('#10b981');
    }
  });

  it('ticks the brand-colour item of the re-brand checklist only when given', () => {
    expect(rosa('CLAUDE.md')).toMatch(/- \[x\] `src\/styles\/global\.css` — brand colour/);
    expect(plain('CLAUDE.md')).toMatch(/- \[ \] `src\/styles\/global\.css` — brand colour/);
  });

  it('without --accent the generated project is unchanged', () => {
    expect(plain('src/styles/global.css')).toMatch(EMERALD_HUE);
    expect(plain('public/favicon.svg')).toContain('#10b981');
  });

  it('an invalid colour fails before anything is written', () => {
    const out = join(dir, 'bad-app');
    const run = spawnSync(
      'node',
      ['scripts/init.mjs', '--name', 'bad-app', '--out', out, '--accent', 'rosa'],
      { encoding: 'utf8' },
    );
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/--accent/);
    expect(existsSync(out)).toBe(false);
  });
});
