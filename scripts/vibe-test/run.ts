/**
 * scripts/vibe-test/run.ts
 *
 * Orchestrates one vibe-test run for a single component guideline: build the
 * doc-only prompt, call the (injected) model function, extract the code,
 * score it against the real compiler. `generate` is a plain injected
 * function rather than a direct SDK import so this can be exercised in
 * tests with a stub — no network, no API key, no module-mocking framework
 * required (see src/tests/vibe-test.test.ts).
 */

import type { ComponentGuideline } from './guideline-index.ts';
import { buildPrompt, extractCodeFromResponse } from './prompt.ts';
import { scoreGeneratedCode, type ScoreResult } from './score.ts';

export interface VibeTestResult extends ScoreResult {
  slug: string;
  title: string;
  category: string;
  code: string;
}

/** Stands in for "call the model" — the real implementation is scripts/vibe-test/anthropic-client.ts. */
export type Generate = (prompt: string) => Promise<string>;

export async function runVibeTestForComponent(
  guideline: ComponentGuideline,
  generate: Generate,
  repoRoot: string,
): Promise<VibeTestResult> {
  const prompt = buildPrompt(guideline);
  const response = await generate(prompt);
  const code = extractCodeFromResponse(response);
  const score = scoreGeneratedCode({ code, slug: guideline.slug, repoRoot });

  return {
    slug: guideline.slug,
    title: guideline.title,
    category: guideline.category,
    code,
    ...score,
  };
}
