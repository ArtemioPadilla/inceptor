import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Source-level guards for Wave 4 (docs surfaces) of docs/AUDIT-2026-06.md §4.5-4.6.
// Covers issues #140 (edit-link), #145 (stub migration), #142 (real blog posts).

const repoRoot = new URL('../../', import.meta.url).pathname;
const read = (p: string) => readFileSync(join(repoRoot, p), 'utf-8');

// ── 1. DocsLayout — "Edit this page" link (#140) ───────────────────────────

describe('DocsLayout — edit this page link (#140)', () => {
  it('contains the GitHub edit URL pattern', () => {
    const layout = read('src/layouts/DocsLayout.astro');
    expect(layout).toContain('github.com/ArtemioPadilla/inceptor/edit/main/src/content/docs/');
  });

  it('derives the edit URL from the slug prop, not a hardcoded path', () => {
    const layout = read('src/layouts/DocsLayout.astro');
    // The URL is built from template literal using editFilePath/editFileExt
    expect(layout).toContain('editUrl');
    expect(layout).toContain('editFilePath');
  });

  it('renders the edit link as an external link with noopener', () => {
    const layout = read('src/layouts/DocsLayout.astro');
    expect(layout).toContain('target="_blank"');
    expect(layout).toContain('rel="noopener noreferrer"');
  });

  it('places the edit link after the content slot and before prev/next nav', () => {
    const layout = read('src/layouts/DocsLayout.astro');
    // Look for the rendered href, not the variable declaration
    const editLinkIdx = layout.indexOf('href={editUrl}');
    const slotIdx = layout.indexOf('<slot />');
    const navIdx = layout.indexOf('rel="prev"');
    // edit link must come after <slot /> and before prev/next
    expect(editLinkIdx, 'href={editUrl} not found in layout').toBeGreaterThan(-1);
    expect(editLinkIdx).toBeGreaterThan(slotIdx);
    if (navIdx !== -1) {
      expect(editLinkIdx).toBeLessThan(navIdx);
    }
  });

  it('uses muted text styling (text-muted-foreground)', () => {
    const layout = read('src/layouts/DocsLayout.astro');
    expect(layout).toContain('text-muted-foreground');
  });
});

// ── 2. No stub pages (#145) ────────────────────────────────────────────────

describe('docs content — no "being migrated" stubs (#145)', () => {
  function collectMdFiles(dir: string): string[] {
    const entries = readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...collectMdFiles(full));
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
        files.push(full);
      }
    }
    return files;
  }

  it('zero docs pages contain "being migrated"', () => {
    const docsDir = join(repoRoot, 'src/content/docs');
    const mdFiles = collectMdFiles(docsDir);
    const stubs: string[] = [];
    for (const file of mdFiles) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('being migrated')) {
        stubs.push(file.replace(repoRoot, ''));
      }
    }
    expect(stubs, `Found stub pages: ${stubs.join(', ')}`).toHaveLength(0);
  });

  it('all 19 previously-stubbed pages now have real content (>200 chars each)', () => {
    const expectedFiles = [
      'src/content/docs/ethics-ux/framework.md',
      'src/content/docs/ethics-ux/checklist.md',
      'src/content/docs/ethics-ux/quality-bar.md',
      'src/content/docs/ethics-ux/stakeholder-analysis.md',
      'src/content/docs/how-we-work/shape-up.md',
      'src/content/docs/how-we-work/tdd.md',
      'src/content/docs/how-we-work/spec-dd.md',
      'src/content/docs/how-we-work/sub-agents.md',
      'src/content/docs/stack/overview.md',
      'src/content/docs/reference/env-vars.md',
      'src/content/docs/reference/file-structure.md',
      'src/content/docs/building/adding-a-component.md',
      'src/content/docs/building/compound-components.md',
      'src/content/docs/building/hydration.md',
      'src/content/docs/building/theming.md',
      'src/content/docs/building/testing.md',
      'src/content/docs/building/visual-regression.md',
      'src/content/docs/history/integration-plan.md',
      'src/content/docs/history/roadmap.md',
    ];

    for (const file of expectedFiles) {
      const content = read(file);
      expect(content, `${file} is too short — still a stub?`).toSatisfy(
        (s: string) => s.length > 200,
      );
      expect(content, `${file} still contains "being migrated"`).not.toContain(
        'being migrated',
      );
    }
  });
});

// ── 3. Blog — ≥ 3 non-draft posts (#142) ──────────────────────────────────

describe('blog collection — real posts (#142)', () => {
  function collectBlogFiles(): string[] {
    const blogDir = join(repoRoot, 'src/content/blog');
    return readdirSync(blogDir).filter(
      (f) => f.endsWith('.md') || f.endsWith('.mdx'),
    );
  }

  function isDraft(content: string): boolean {
    // Look for "draft: true" in frontmatter (between the first two ---)
    const fm = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) return false;
    // Non-null: the regex has one capture group; fm[1] is always present when fm is truthy.
    return /^\s*draft:\s*true\s*$/m.test(fm[1]!);
  }

  it('has at least 3 blog files', () => {
    const files = collectBlogFiles();
    expect(files.length).toBeGreaterThanOrEqual(3);
  });

  it('has at least 3 non-draft posts', () => {
    const blogDir = join(repoRoot, 'src/content/blog');
    const files = collectBlogFiles();
    const nonDraft = files.filter((f) => {
      const content = readFileSync(join(blogDir, f), 'utf-8');
      return !isDraft(content);
    });
    expect(nonDraft.length, `Only ${nonDraft.length} non-draft posts found`).toBeGreaterThanOrEqual(3);
  });

  it('the three changelog-digest posts exist', () => {
    const blogDir = join(repoRoot, 'src/content/blog');
    const files = readdirSync(blogDir);

    // Verify by checking content keywords rather than filenames,
    // since filenames may vary
    const allContent = files
      .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
      .map((f) => readFileSync(join(blogDir, f), 'utf-8'));

    const hasComponentPost = allContent.some(
      (c) => c.includes('44 component') || c.includes('component library'),
    );
    const hasBackendPost = allContent.some(
      (c) => c.includes('backend archetype') || c.includes('server-node') || c.includes('Hono'),
    );
    const hasAuditPost = allContent.some(
      (c) => c.includes('audit') && (c.includes('Wave') || c.includes('AUDIT-2026')),
    );

    expect(hasComponentPost, 'Missing component library post').toBe(true);
    expect(hasBackendPost, 'Missing backend archetypes post').toBe(true);
    expect(hasAuditPost, 'Missing June 2026 audit post').toBe(true);
  });

  it('all blog posts have required frontmatter fields', () => {
    const blogDir = join(repoRoot, 'src/content/blog');
    const files = collectBlogFiles();

    for (const file of files) {
      const content = readFileSync(join(blogDir, file), 'utf-8');
      expect(content, `${file} is missing title`).toMatch(/^title:/m);
      expect(content, `${file} is missing description`).toMatch(/^description:/m);
      expect(content, `${file} is missing pubDate`).toMatch(/^pubDate:/m);
    }
  });
});
