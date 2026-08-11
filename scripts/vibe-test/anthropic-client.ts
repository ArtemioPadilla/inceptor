/**
 * scripts/vibe-test/anthropic-client.ts
 *
 * Thin wrapper around @anthropic-ai/sdk implementing the `Generate` function
 * shape run.ts expects. This is the ONLY file in the harness that talks to
 * the network — kept separate on purpose so run.ts's orchestration logic can
 * be unit tested with a stub instead of this real implementation (see
 * src/tests/vibe-test.test.ts). Never imported from src/ — it is a dev-only,
 * manually-invoked CLI dependency (see docs/vibe-test.md).
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Generate } from './run.ts';

// Same model family the repo's own AI triage workflow uses
// (.github/workflows/claude.yml, via claude-code-action) — good enough for a
// "does the doc alone produce compiling usage code" smoke check.
const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 2048;

export function createAnthropicGenerate(apiKey: string): Generate {
  const client = new Anthropic({ apiKey });

  return async (prompt: string): Promise<string> => {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === 'text');
    if (!textBlock) {
      throw new Error('Anthropic response contained no text block.');
    }
    return textBlock.text;
  };
}
