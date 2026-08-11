/**
 * scripts/vibe-test/guideline-index.ts
 *
 * Parses docs/component-guidelines/*.md into individual per-component
 * sections (ROADMAP Epic 26 stretch item — the "vibe-test" harness). Each
 * file uses one `## ComponentName` heading per component, immediately
 * followed by a `Source: [\`src/...\`](...)` line — except a couple of
 * multi-export sections where the source path is inlined directly in the
 * heading, e.g.
 * `## Citation / CitationRef / CitationList (\`src/components/ui/ai/citation.tsx\`)`.
 * Either way, the first backtick-quoted `src/....ts(x)` path found anywhere
 * in the heading+body is treated as the real source file — that's what a
 * CLI slug and an `@/*`-aliased import specifier get derived from.
 *
 * extractGuidelineSections() is pure (markdown string in, sections out) so
 * the parsing behavior is unit-testable without touching the filesystem.
 * loadGuidelineIndex() is the thin I/O wrapper the CLI actually calls.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

export interface ComponentGuideline {
  /** CLI-facing identifier, derived from the real source file's basename (e.g. "dialog", "data-table"). */
  slug: string;
  /** The `## ` heading text, verbatim (may carry extra detail, e.g. "Citation / CitationRef / CitationList (...)"). */
  title: string;
  /** The guideline file this section came from, e.g. "compound.md". */
  file: string;
  /** `file` without its extension — matches gallery.ts's `category` field. */
  category: string;
  /** Real component source path, repo-relative, e.g. "src/components/ui/dialog.tsx". */
  sourcePath: string;
  /** `@/*`-aliased module specifier to import from, e.g. "@/components/ui/dialog". */
  importSpecifier: string;
  /**
   * The section's full markdown body (heading line excluded), verbatim —
   * this is the ONLY context the vibe-test harness gives the model.
   */
  content: string;
}

const SOURCE_PATH_RE = /`(src\/[^`]+\.tsx?)`/;
const HEADING_RE = /^## (.+)$/gm;

/** Pure: parse one guideline markdown file's text into per-component sections. */
export function extractGuidelineSections(markdown: string, file: string): ComponentGuideline[] {
  const category = file.replace(/\.md$/, '');
  const headings: { title: string; start: number; contentStart: number }[] = [];

  for (const match of markdown.matchAll(HEADING_RE)) {
    const title = match[1]!.trim();
    const start = match.index!;
    const contentStart = start + match[0].length;
    headings.push({ title, start, contentStart });
  }

  const sections: ComponentGuideline[] = [];

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i]!;
    const next = headings[i + 1];
    const sectionEnd = next ? next.start : markdown.length;

    // Body = from the end of the heading line up to the next heading (or
    // EOF), with a trailing "---" horizontal rule (if present) trimmed off.
    const rawBody = markdown.slice(heading.contentStart, sectionEnd);
    const content = rawBody.replace(/\n---\s*$/, '').trim();

    // Source path can be a dedicated "Source: [`path`](...)" line in the
    // body, or inlined directly in the heading text (Citation-style) —
    // search both.
    const searchable = `${heading.title}\n${content}`;
    const sourceMatch = searchable.match(SOURCE_PATH_RE);
    if (!sourceMatch) {
      // No resolvable source file — skip rather than guess. Keeps the index
      // trustworthy: every emitted entry has a real, importable module.
      continue;
    }

    const sourcePath = sourceMatch[1]!;
    const slug = basename(sourcePath).replace(/\.tsx?$/, '');
    const importSpecifier = `@/${sourcePath.replace(/^src\//, '').replace(/\.tsx?$/, '')}`;

    sections.push({
      slug,
      title: heading.title,
      file,
      category,
      sourcePath,
      importSpecifier,
      content,
    });
  }

  return sections;
}

const GUIDELINES_DIR = 'docs/component-guidelines';

/**
 * I/O: read every guideline file (except README.md) under
 * docs/component-guidelines/ and flatten into one index.
 */
export function loadGuidelineIndex(repoRoot: string): ComponentGuideline[] {
  const dir = join(repoRoot, GUIDELINES_DIR);
  const files = readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md');

  return files.flatMap((file) => {
    const markdown = readFileSync(join(dir, file), 'utf-8');
    return extractGuidelineSections(markdown, file);
  });
}
