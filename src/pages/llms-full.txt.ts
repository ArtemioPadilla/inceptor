import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE, REPO_URL } from '@/lib/site-meta';

/**
 * /llms-full.txt — every docs page concatenated as plain markdown, so an
 * agent can ingest the whole methodology in one request instead of crawling
 * 36 HTML pages. Identity comes from src/lib/site-meta.ts
 * (⚠️ RE-BRAND ON INSTANTIATION — see CLAUDE.md § "Agent-readable surface").
 */
export const GET: APIRoute = async () => {
  const docs = (await getCollection('docs')).sort((a: CollectionEntry<'docs'>, b: CollectionEntry<'docs'>) => a.id.localeCompare(b.id));

  const sections = docs.map((e: CollectionEntry<'docs'>) => {
    const heading = `\n\n---\n\n# ${e.data.title}\n`;
    const desc = e.data.description ? `\n> ${e.data.description}\n` : '';
    return `${heading}${desc}\n${e.body ?? ''}`;
  });

  const body = `# ${SITE.name} — full documentation

> ${SITE.description}

Source: ${REPO_URL} (${SITE.license}).
${sections.join('\n')}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
