/**
 * Starting looks for scripts/init.mjs (#339). `--look <name>` picks one of
 * three landings built from the marketing blocks in src/components/blocks/,
 * each with its own display face, composition and highlight treatment. A look
 * is a starting point, not a design: the generated CLAUDE.md still sends the
 * project through the design round (#336).
 */

const TEXT_FONT = '@fontsource-variable/hanken-grotesk';
const MONO_FONT = '@fontsource-variable/jetbrains-mono';
const SANS_STACK =
  "'Hanken Grotesk Variable', 'Hanken Grotesk Fallback', 'Hanken Grotesk Fallback Roboto',\n    'Hanken Grotesk Fallback Liberation', ui-sans-serif, system-ui, sans-serif";

export const LOOKS = {
  /** Serif display, a text column, rules instead of boxes. */
  editorial: {
    summary: 'serif display, one text column, rules instead of boxes',
    display: { pkg: '@fontsource-variable/fraunces' },
    blocks: ['HighlightHeadline', 'PrinciplesPanel', 'LevelLadder', 'CtaBand'],
    assets: [],
  },
  /** Heavy grotesque display, a hero with a graphic, blocks of colour. */
  bold: {
    summary: 'heavy grotesque display, a hero with a graphic, blocks of colour',
    display: {
      pkg: '@fontsource-variable/bricolage-grotesque',
      family: 'Bricolage Grotesque',
      file: 'bricolage-grotesque-latin-wght-normal.woff2',
      stack:
        "'Bricolage Grotesque Variable', 'Bricolage Grotesque Fallback',\n    'Bricolage Grotesque Fallback Roboto', 'Bricolage Grotesque Fallback Liberation', ui-sans-serif,\n    system-ui, sans-serif",
    },
    blocks: [
      'HeroGraphic',
      'HighlightHeadline',
      'PairedCards',
      'LevelLadder',
      'PrinciplesPanel',
      'CtaBand',
    ],
    assets: ['hero-lines.svg', 'hero-accents.svg'],
  },
  /** One sans family, a centred hero, the steps first. */
  product: {
    summary: 'one sans family, a centred hero, the steps first',
    display: { pkg: TEXT_FONT, stack: SANS_STACK },
    blocks: ['HighlightHeadline', 'LevelLadder', 'PairedCards', 'CtaBand'],
    assets: [],
  },
};

/** Font packages a look's layout imports: display, text and mono, without repeats. */
export function fontPackages(look) {
  return [...new Set([LOOKS[look].display.pkg, TEXT_FONT, MONO_FONT])];
}

/**
 * The template's global.css with the look's display face: the
 * `--font-display` stack, and the Fraunces fallback faces replaced by
 * `displayFaces` (the output of scripts/font-fallbacks.mjs for the look's
 * font) or dropped when the look reuses the text family.
 */
export function lookCss(css, look, displayFaces = '') {
  const { display } = LOOKS[look];
  if (!display.stack) return css;
  let first = true;
  return css
    .replace(/--font-display:[^;]*;/, `--font-display:\n    ${display.stack};`)
    .replace(/@font-face \{\s*font-family: 'Fraunces Fallback[^}]*\}\n/g, () => {
      const out = first && displayFaces ? `${displayFaces}\n` : '';
      first = false;
      return out;
    })
    .replace(
      'Arial/Georgia (macOS,\n   Windows), Roboto/Noto Serif (Android), Liberation Sans/DejaVu Serif\n   (Linux, CI)',
      'Arial (macOS, Windows), Roboto (Android), Liberation Sans (Linux, CI)',
    )
    .replace('editorial serif display + grotesque body', 'grotesque display + grotesque body');
}

const COPY = {
  en: {
    eyebrow: 'One line on who this is for',
    highlight: 'starts here.',
    lead: 'Say in two sentences what this product does and why someone should care. This is placeholder copy.',
    primary: 'Get started',
    secondary: 'How it works',
    stepsTitle: 'How it works',
    cards: [
      {
        eyebrow: 'First',
        title: 'What it does',
        body: 'One sentence on the main thing this product does.',
        points: ['A concrete benefit, in plain words.', 'A second one.'],
      },
      {
        eyebrow: 'Second',
        title: 'Who it is for',
        body: 'One sentence on who gets the most out of it.',
        points: ['What they have today.', 'What changes for them.'],
      },
    ],
    levels: [
      { code: '1', name: 'First step', detail: 'What the person does first.' },
      { code: '2', name: 'Second step', detail: 'What happens next.' },
      { code: '3', name: 'Third step', detail: 'What they get.' },
      { code: '4', name: 'Result', detail: 'Where they end up.' },
    ],
    principlesTitle: 'What we stand for',
    principlesLead: 'Three commitments this product keeps.',
    principles: [
      { title: 'A first principle', text: 'One sentence that a user could hold you to.' },
      { title: 'A second principle', text: 'Another promise, concrete enough to be broken.' },
      { title: 'A third principle', text: 'And one more.' },
    ],
    ctaEyebrow: 'Next step',
    ctaTitle: 'One clear next step',
    ctaBody: 'Say what happens when someone clicks, and nothing else.',
  },
  es: {
    eyebrow: 'Una línea sobre para quién es esto',
    highlight: 'empieza aquí.',
    lead: 'Di en dos frases qué hace este producto y por qué le importa a alguien. Este texto es provisional.',
    primary: 'Empezar',
    secondary: 'Cómo funciona',
    stepsTitle: 'Cómo funciona',
    cards: [
      {
        eyebrow: 'Primero',
        title: 'Qué hace',
        body: 'Una frase sobre lo principal que hace este producto.',
        points: ['Un beneficio concreto, en palabras simples.', 'Un segundo beneficio.'],
      },
      {
        eyebrow: 'Segundo',
        title: 'Para quién es',
        body: 'Una frase sobre quién le saca más provecho.',
        points: ['Lo que tiene hoy.', 'Lo que cambia.'],
      },
    ],
    levels: [
      { code: '1', name: 'Primer paso', detail: 'Lo que la persona hace primero.' },
      { code: '2', name: 'Segundo paso', detail: 'Lo que pasa después.' },
      { code: '3', name: 'Tercer paso', detail: 'Lo que recibe.' },
      { code: '4', name: 'Resultado', detail: 'A dónde llega.' },
    ],
    principlesTitle: 'Lo que defendemos',
    principlesLead: 'Tres compromisos que este producto cumple.',
    principles: [
      { title: 'Un primer principio', text: 'Una frase que un usuario podría exigirte.' },
      {
        title: 'Un segundo principio',
        text: 'Otra promesa, lo bastante concreta para poder romperse.',
      },
      { title: 'Un tercer principio', text: 'Y una más.' },
    ],
    ctaEyebrow: 'Siguiente paso',
    ctaTitle: 'Un siguiente paso claro',
    ctaBody: 'Di qué pasa cuando alguien hace clic, y nada más.',
  },
};

/** The placeholder copy of the generated landings, by language (the site's /looks page reuses it). */
export const LOOK_COPY = COPY;

const BUTTON =
  'inline-flex min-h-12 items-center rounded-xl px-6 py-3 text-base font-semibold transition-colors';
const PRIMARY = `${BUTTON} bg-primary text-primary-foreground hover:bg-primary/90`;
const SECONDARY = `${BUTTON} border border-input bg-background text-foreground hover:bg-muted`;
const H2 =
  'font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl';

const SECTIONS = {
  cards: `    <section class="mx-auto max-w-6xl px-5 py-12">
      <PairedCards cards={cards} />
    </section>`,
  ladder: (
    title,
  ) => `    <section id="steps" aria-labelledby="steps-title" class="mx-auto max-w-6xl px-5 py-12">
      <h2 id="steps-title" class="${H2}">${title}</h2>
      <div class="mt-8">
        <LevelLadder levels={levels} />
      </div>
    </section>`,
  principles: `    <section class="mx-auto max-w-6xl px-5 py-12">
      <PrinciplesPanel title={t.principlesTitle} lead={t.principlesLead} items={t.principles} />
    </section>`,
  cta: `    <section class="mx-auto max-w-6xl px-5 pb-16 pt-12">
      <CtaBand eyebrow={t.ctaEyebrow} title={t.ctaTitle} body={t.ctaBody}>
        <a slot="actions" href="#main" class="${BUTTON} bg-highlight-foreground text-highlight hover:opacity-90">{t.primary}</a>
      </CtaBand>
    </section>`,
};

const BODY = {
  editorial: (t) => `    <section class="mx-auto max-w-4xl px-5 pb-12 pt-20 sm:pt-28">
      <p class="font-mono text-sm uppercase tracking-widest text-primary">{t.eyebrow}</p>
      <HighlightHeadline tag="h1" size="hero" text={name} highlight={t.highlight} class="mt-4" />
      <p class="mt-8 max-w-prose border-l-2 border-foreground pl-5 text-xl leading-relaxed text-muted-foreground">
        {t.lead}
      </p>
      <div class="mt-8 flex flex-wrap items-center gap-3">
        <a href="#steps" class="${PRIMARY}">{t.secondary}</a>
      </div>
    </section>
${SECTIONS.principles}
${SECTIONS.ladder(t.stepsTitle)}
${SECTIONS.cta}`,
  bold: (
    t,
  ) => `    <HeroGraphic eyebrow={t.eyebrow} title={name} highlight={t.highlight} lead={t.lead}>
      <Fragment slot="actions">
        <a href="#steps" class="${PRIMARY}">{t.primary}</a>
        <a href="#steps" class="${SECONDARY}">{t.secondary}</a>
      </Fragment>
    </HeroGraphic>
${SECTIONS.cards}
${SECTIONS.ladder(t.stepsTitle)}
${SECTIONS.principles}
${SECTIONS.cta}`,
  product: (t) => `    <section class="mx-auto max-w-3xl px-5 pb-10 pt-20 text-center sm:pt-28">
      <p class="font-mono text-sm uppercase tracking-widest text-primary">{t.eyebrow}</p>
      <HighlightHeadline tag="h1" size="hero" text={name} highlight={t.highlight} class="mt-4" />
      <p class="mx-auto mt-6 max-w-prose text-lg leading-relaxed text-muted-foreground">{t.lead}</p>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a href="#steps" class="${PRIMARY}">{t.primary}</a>
      </div>
    </section>
${SECTIONS.ladder(t.stepsTitle)}
${SECTIONS.cards}
${SECTIONS.cta}`,
};

/** Source of `src/pages/index.astro` for a look. Placeholder copy, marked for the agent. */
export function landing(look, { name, lang }) {
  const t = COPY[lang] ?? COPY.en;
  const body = BODY[look](t);
  // Import only the blocks the page itself renders (HeroGraphic brings its own headline).
  const imports = LOOKS[look].blocks
    .filter((block) => new RegExp(`<${block}\\b`).test(body))
    .map((block) => `import ${block} from '../components/blocks/${block}.astro';`)
    .join('\n');
  const { stepsTitle: _s, ...data } = t;
  return `---
import BaseLayout from '../layouts/BaseLayout.astro';
${imports}

// TODO(agent): placeholder copy from \`--look ${look}\`. Replace every string
// below with the product's own, after the design round (docs/design/).
const name = ${JSON.stringify(name)};
const t = ${JSON.stringify(data, null, 2)};
${/cards=\{cards\}/.test(body) ? 'const cards = t.cards as [(typeof t.cards)[number], (typeof t.cards)[number]];\n' : ''}${/levels=\{levels\}/.test(body) ? 'const levels = t.levels;\n' : ''}---
<BaseLayout title={name}>
  <main id="main">
${body}
  </main>
</BaseLayout>
`;
}
