/**
 * scripts/vibe-test/prompt.ts
 *
 * Builds the model-facing prompt from a single ComponentGuideline section
 * and extracts generated code back out of the model's markdown response.
 * This is the harness's core methodology: the model gets ONLY the section
 * text below (Purpose / When to use / API overview / Common mistakes) — no
 * access to the component's real source file.
 */

import type { ComponentGuideline } from './guideline-index.ts';

export function buildPrompt(guideline: ComponentGuideline): string {
  return `You are building a minimal, working usage example for a UI component in an Astro + React 19 + TypeScript (strict mode) codebase, using the documentation below as your ONLY source of truth. You do NOT have access to this component's real source file — do not guess at props, exports, or behavior beyond what's written here.

Constraints:
- Import everything you use from exactly this module: "${guideline.importSpecifier}"
- Write ONE self-contained, default-exported React function component named "${toPascalCase(guideline.slug)}Example" that renders a minimal but complete usage of ${guideline.title}, following the API overview and deliberately avoiding every item listed under "Common mistakes".
- TypeScript strict mode is on — no implicit any, no unchecked type errors.
- Return ONLY the code, inside a single \`\`\`tsx fenced block. No prose before or after the fence.

--- BEGIN DOCUMENTATION (category: ${guideline.category}) ---
## ${guideline.title}

${guideline.content}
--- END DOCUMENTATION ---`;
}

/**
 * Extracts code from the first fenced code block in a model response; falls
 * back to the raw trimmed text if no fence is found (models occasionally
 * forget the fence despite the instruction).
 */
export function extractCodeFromResponse(response: string): string {
  const fenced = response.match(/```(?:tsx|ts|jsx|js)?\n([\s\S]*?)```/);
  return (fenced ? fenced[1]! : response).trim();
}

function toPascalCase(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
