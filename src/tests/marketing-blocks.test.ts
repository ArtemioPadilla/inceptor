import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * #338: /blocks shipped application blocks only, so every landing started
 * from a centred title. Six marketing blocks, plain Astro with zero JS,
 * generalised from Buró del Pueblo's landing.
 */
const BLOCKS = [
  'HeroGraphic',
  'HighlightHeadline',
  'PairedCards',
  'LevelLadder',
  'PrinciplesPanel',
  'CtaBand',
];
const source = (name: string) => readFileSync(`src/components/blocks/${name}.astro`, 'utf8');

describe('marketing blocks', () => {
  it.each(BLOCKS)('%s is plain Astro: no island, no inline style, no hex colour', (name) => {
    const src = source(name);
    // Zero JS: nothing hydrates and nothing ships a <script>.
    expect(src).not.toMatch(/client:(load|idle|visible|only|media)/);
    expect(src).not.toMatch(/<script/);
    // Strict CSP (style-src 'self'): no style attribute, no define:vars.
    expect(src).not.toMatch(/\sstyle=|define:vars/);
    // Tokens, never literals: a re-brand must reach every block.
    // (Comments are stripped first: an issue reference like #338 is not a colour.)
    const code = src.replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g, '');
    expect(code).not.toMatch(/#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\b/i);
  });

  it('the fills come from the brand tokens, each with its own text colour', () => {
    expect(source('HighlightHeadline')).toMatch(/bg-highlight[^"']*text-highlight-foreground/);
    expect(source('CtaBand')).toMatch(/bg-highlight[^"']*text-highlight-foreground/);
    expect(source('PairedCards')).toMatch(/bg-brand-3[^"']*text-brand-3-foreground/);
    expect(source('LevelLadder')).toMatch(/bg-brand-2[^"']*text-brand-2-foreground/);
    expect(source('LevelLadder')).toMatch(/bg-primary[^"']*text-primary-foreground/);
  });

  it('the hero graphic is masked layers over tokens, hidden from assistive tech and print', () => {
    const hero = source('HeroGraphic');
    expect(hero).toMatch(/mask-image:\s*url\(/);
    expect(hero).toMatch(/background:\s*var\(--(border|primary)\)/);
    expect(hero).toMatch(/aria-hidden="true"/);
    expect(hero).toMatch(/print:hidden/);
    for (const layer of ['hero-lines.svg', 'hero-accents.svg']) {
      expect(existsSync(`src/assets/blocks/${layer}`), layer).toBe(true);
      expect(hero).toContain(layer);
    }
  });

  it('the level ladder says the level in text, not in colour alone', () => {
    const ladder = source('LevelLadder');
    expect(ladder).toMatch(/level\.code/);
    expect(ladder).toMatch(/level\.name/);
    expect(ladder).toMatch(/<ol/);
  });
});

describe('blocks/marketing.astro', () => {
  const page = readFileSync('src/pages/blocks/marketing.astro', 'utf8');

  it('shows every block with a Preview/Code toggle', () => {
    for (const name of BLOCKS) expect(page, name).toMatch(new RegExp(`<${name}\\b`));
    expect(page.match(/<BlockPreviewToggle/g)?.length).toBe(BLOCKS.length);
  });

  it('is linked from the blocks index', () => {
    expect(readFileSync('src/pages/blocks/index.astro', 'utf8')).toMatch(/\/blocks\/marketing/);
  });
});
