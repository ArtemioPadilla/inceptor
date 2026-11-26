#!/usr/bin/env node
/**
 * Metric-matched fallback faces for a webfont (#327).
 *
 *   node scripts/font-fallbacks.mjs <font.woff2|.ttf|.otf> --family "Hanken Grotesk" --kind sans
 *
 * Prints one `@font-face` per local font (sans: Arial, Roboto, Liberation
 * Sans; serif: Georgia, Noto Serif, DejaVu Serif), each resized with
 * `size-adjust` and the three metric overrides so text first paints at the
 * webfont's width and line box, and the swap does not shift the layout.
 * Paste the output into src/styles/global.css and list the faces right after
 * the webfont in the font stack. src/tests/fonts-self-hosted.test.ts fails
 * if global.css and this script disagree for the shipped fonts.
 *
 * Method (Capsize): size-adjust = webfont average width / local average
 * width, both as a fraction of the em; the overrides are the webfont's
 * ascent, descent and line gap divided by that factor. The average width is
 * weighted by letter frequency. For a variable font the default instance is
 * measured, so a heading set much bolder than it still shifts a little.
 *
 * No dependency: reads the tables it needs (head, hhea, hmtx, cmap) from an
 * sfnt or a WOFF2 container itself.
 */
import { readFileSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

/**
 * Letter-frequency weights for Latin text and the local fonts' metrics come
 * from Capsize (@capsizecss/unpack 4.0.1 and @capsizecss/metrics 4.5.0, MIT,
 * © SEEK). DejaVu Serif and Liberation Sans are not in that collection: they
 * were measured from the font files with the same weights.
 */
// prettier-ignore
const WEIGHTS = {"0":0.0053,"1":0.0023,"2":0.0026,"3":0.001,"4":0.0008,"5":0.0015,"6":0.0007,"7":0.0005,"8":0.0007,"9":0.0006,",":0.0083," ":0.154,"t":0.0672,"h":0.0351,"e":0.0922,"o":0.0571,"f":0.017,"P":0.0023,"p":0.0163,"l":0.0304,"'":0.0014,"s":0.0469,"R":0.0015,"u":0.0207,"b":0.0114,"i":0.0588,"c":0.0232,"C":0.0031,"n":0.0578,"a":0.0668,"d":0.0298,"y":0.0123,"w":0.011,"B":0.002,"r":0.0526,"z":0.0011,"G":0.0011,"j":0.0009,"T":0.0041,".":0.0079,"L":0.0012,"k":0.0046,"m":0.0181,"]":0.0007,"J":0.0009,"F":0.0015,"v":0.0076,"g":0.0155,"A":0.004,"N":0.0014,"-":0.0018,"H":0.0013,"D":0.0013,"M":0.0025,"I":0.0022,"E":0.0011,"\"":0.0012,"S":0.0041,"(":0.001,")":0.001,"x":0.0025,"W":0.0012,"Q":0.0001,"Y":0.0003,"q":0.0008,"V":0.0005,"á":0.0001,"K":0.0007,"U":0.0016,"=":0.0007,"[":0.0021,"O":0.0009,"é":0.0001,"$":0.0002,":":0.0008,"|":0.0038,"/":0.0001,"%":0.0001,"Z":0.0002,";":0.0001,"X":0.0001};

/** Local fonts by platform: average width over units per em, and the suffix of the face name. */
export const LOCAL_FONTS = {
  sans: [
    { local: 'Arial', suffix: '', xWidthAvg: 913, unitsPerEm: 2048 },
    { local: 'Roboto', suffix: ' Roboto', xWidthAvg: 911, unitsPerEm: 2048 },
    { local: 'Liberation Sans', suffix: ' Liberation', xWidthAvg: 913, unitsPerEm: 2048 },
  ],
  serif: [
    { local: 'Georgia', suffix: '', xWidthAvg: 913, unitsPerEm: 2048 },
    { local: 'Noto Serif', suffix: ' Noto', xWidthAvg: 481, unitsPerEm: 1000 },
    { local: 'DejaVu Serif', suffix: ' DejaVu', xWidthAvg: 1058, unitsPerEm: 2048 },
  ],
};

// prettier-ignore
const WOFF2_TAGS = ['cmap','head','hhea','hmtx','maxp','name','OS/2','post','cvt ','fpgm','glyf','loca','prep','CFF ','VORG','EBDT','EBLC','gasp','hdmx','kern','LTSH','PCLT','VDMX','vhea','vmtx','BASE','GDEF','GPOS','GSUB','EBSC','JSTF','MATH','CBDT','CBLC','COLR','CPAL','SVG ','sbix','acnt','avar','bdat','bloc','bsln','cvar','fdsc','feat','fmtx','fvar','gvar','hsty','just','lcar','mort','morx','opbd','prop','trak','Zapf','Silf','Glat','Gloc','Feat','Sill'];

/** Tables of a WOFF2 file, by tag. `transformed` marks a table stored in its WOFF2 transform. */
function woff2Tables(buf) {
  const numTables = buf.readUInt16BE(12);
  const compressedSize = buf.readUInt32BE(20);
  let pos = 48;
  const base128 = () => {
    let value = 0;
    for (let i = 0; i < 5; i++) {
      const byte = buf[pos++];
      value = value * 128 + (byte & 0x7f);
      if (!(byte & 0x80)) return value;
    }
    throw new Error('font: malformed WOFF2 table directory');
  };
  const entries = [];
  for (let i = 0; i < numTables; i++) {
    const flags = buf[pos++];
    let tag = WOFF2_TAGS[flags & 0x3f];
    if ((flags & 0x3f) === 63) {
      tag = buf.toString('latin1', pos, pos + 4);
      pos += 4;
    }
    const version = flags >> 6;
    const origLength = base128();
    // glyf and loca are transformed at version 0; every other table at a non-zero version.
    const transformed = tag === 'glyf' || tag === 'loca' ? version === 0 : version !== 0;
    entries.push({ tag, transformed, length: transformed ? base128() : origLength });
  }
  const data = brotliDecompressSync(buf.subarray(pos, pos + compressedSize));
  const tables = {};
  let offset = 0;
  for (const e of entries) {
    tables[e.tag] = { data: data.subarray(offset, offset + e.length), transformed: e.transformed };
    offset += e.length;
  }
  return tables;
}

/** Tables of a TrueType/OpenType (sfnt) file, by tag. */
function sfntTables(buf) {
  const tables = {};
  for (let i = 0; i < buf.readUInt16BE(4); i++) {
    const rec = 12 + i * 16;
    const offset = buf.readUInt32BE(rec + 8);
    tables[buf.toString('latin1', rec, rec + 4)] = {
      data: buf.subarray(offset, offset + buf.readUInt32BE(rec + 12)),
      transformed: false,
    };
  }
  return tables;
}

/** Unicode code point → glyph id, from the best cmap subtable (format 12, else 4). */
function cmapLookup(cmap) {
  const subtables = [];
  for (let i = 0; i < cmap.readUInt16BE(2); i++) {
    const offset = cmap.readUInt32BE(4 + i * 8 + 4);
    subtables.push({ offset, format: cmap.readUInt16BE(offset) });
  }
  const f12 = subtables.find((s) => s.format === 12);
  if (f12) {
    const groups = cmap.readUInt32BE(f12.offset + 12);
    return (cp) => {
      for (let i = 0; i < groups; i++) {
        const g = f12.offset + 16 + i * 12;
        const start = cmap.readUInt32BE(g);
        if (cp >= start && cp <= cmap.readUInt32BE(g + 4))
          return cmap.readUInt32BE(g + 8) + cp - start;
      }
      return 0;
    };
  }
  const f4 = subtables.find((s) => s.format === 4);
  if (!f4) throw new Error('font: no Unicode cmap (format 4 or 12)');
  const o = f4.offset;
  const segs = cmap.readUInt16BE(o + 6) / 2;
  const ends = o + 14;
  const starts = ends + segs * 2 + 2;
  const deltas = starts + segs * 2;
  const ranges = deltas + segs * 2;
  return (cp) => {
    for (let i = 0; i < segs; i++) {
      if (cp > cmap.readUInt16BE(ends + i * 2)) continue;
      const start = cmap.readUInt16BE(starts + i * 2);
      if (cp < start) return 0;
      const delta = cmap.readInt16BE(deltas + i * 2);
      const range = cmap.readUInt16BE(ranges + i * 2);
      if (range === 0) return (cp + delta) & 0xffff;
      const glyph = cmap.readUInt16BE(ranges + i * 2 + range + (cp - start) * 2);
      return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
    }
    return 0;
  };
}

/**
 * Metrics of a font file (WOFF2, TTF or OTF): units per em, hhea ascent,
 * descent and line gap, and the frequency-weighted average advance width.
 */
export function readMetrics(buffer) {
  const buf = Buffer.from(buffer);
  const signature = buf.length >= 4 ? buf.toString('latin1', 0, 4) : '';
  let tables;
  if (signature === 'wOF2') tables = woff2Tables(buf);
  else if (signature === 'OTTO' || signature === 'true' || buf.readUInt32BE?.(0) === 0x00010000) {
    tables = sfntTables(buf);
  } else throw new Error('font: not a WOFF2, TrueType or OpenType file');
  for (const tag of ['head', 'hhea', 'hmtx', 'cmap']) {
    if (!tables[tag]) throw new Error(`font: missing the ${tag} table`);
  }
  const hhea = tables.hhea.data;
  const numberOfHMetrics = hhea.readUInt16BE(34);
  const hmtx = tables.hmtx.data;
  // Untransformed: (advance, lsb) pairs. WOFF2 transform: one flag byte, then the advances alone.
  const advance = (glyph) => {
    const i = Math.min(glyph, numberOfHMetrics - 1);
    return tables.hmtx.transformed ? hmtx.readUInt16BE(1 + i * 2) : hmtx.readUInt16BE(i * 4);
  };
  const glyphOf = cmapLookup(tables.cmap.data);
  let weighted = 0;
  for (const [char, weight] of Object.entries(WEIGHTS)) {
    weighted += advance(glyphOf(char.codePointAt(0))) * weight;
  }
  return {
    unitsPerEm: tables.head.data.readUInt16BE(18),
    ascent: hhea.readInt16BE(4),
    descent: hhea.readInt16BE(6),
    lineGap: hhea.readInt16BE(8),
    xWidthAvg: Math.round(weighted),
  };
}

const percent = (n) => `${Math.round(n * 10000) / 100}%`;

/**
 * The `@font-face` fallback rules for a webfont: one per local font of
 * `kind`, named `<family> Fallback`, `<family> Fallback Roboto`, …
 */
export function fallbackFaces(buffer, { family, kind }) {
  const locals = LOCAL_FONTS[kind];
  if (!locals) throw new Error(`font: unknown kind "${kind}" (use sans | serif)`);
  const m = readMetrics(buffer);
  return locals
    .map((f) => {
      const sizeAdjust = m.xWidthAvg / m.unitsPerEm / (f.xWidthAvg / f.unitsPerEm);
      return [
        '@font-face {',
        `  font-family: '${family} Fallback${f.suffix}';`,
        `  src: local('${f.local}');`,
        `  size-adjust: ${percent(sizeAdjust)};`,
        `  ascent-override: ${percent(m.ascent / m.unitsPerEm / sizeAdjust)};`,
        `  descent-override: ${percent(Math.abs(m.descent) / m.unitsPerEm / sizeAdjust)};`,
        `  line-gap-override: ${percent(m.lineGap / m.unitsPerEm / sizeAdjust)};`,
        '}',
      ].join('\n');
    })
    .join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const flag = (n) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const file = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
  const family = flag('family');
  const kind = flag('kind') ?? 'sans';
  if (!file || !family) {
    console.error(
      'usage: node scripts/font-fallbacks.mjs <font.woff2|.ttf|.otf> --family "Name" [--kind sans|serif]',
    );
    process.exit(1);
  }
  try {
    console.log(fallbackFaces(readFileSync(file), { family, kind }));
  } catch (err) {
    console.error(`✗ ${err.message}`);
    process.exit(1);
  }
}
