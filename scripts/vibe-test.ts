#!/usr/bin/env node
/**
 * scripts/vibe-test.ts
 *
 * "Vibe-test" harness — ROADMAP Epic 26's stretch item. Spawns a fresh
 * model call, gives it ONLY one component's guideline-doc section from
 * docs/component-guidelines/ (no access to the component's real source),
 * asks it to build a minimal working usage example from the doc alone, then
 * actually type-checks the result against this repo's real component. This
 * validates the premise the whole template depends on: that a coding agent
 * (forja, or any LLM) can build correct UI from the docs, not just from
 * reading the source directly. See docs/vibe-test.md for the full write-up,
 * including how to turn this into a scheduled job (NOT done here — see that
 * doc for why).
 *
 * This is a MANUALLY-INVOKED dev tool. It spends real Anthropic API credits
 * every run and is intentionally NOT wired into `npm run check` or any CI
 * workflow.
 *
 * Usage:
 *   npm run vibe-test                       # one random component
 *   npm run vibe-test -- --component dialog # a specific component (slug)
 *   npm run vibe-test -- --all              # every documented component
 *   npm run vibe-test -- --list             # list available component slugs, then exit
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

import { loadGuidelineIndex, type ComponentGuideline } from './vibe-test/guideline-index.ts';
import { runVibeTestForComponent, type VibeTestResult } from './vibe-test/run.ts';
import { createAnthropicGenerate } from './vibe-test/anthropic-client.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = join(__dirname, '..');

interface CliArgs {
  all: boolean;
  list: boolean;
  component: string | undefined;
}

function parseArgs(argv: string[]): CliArgs {
  const componentIdx = argv.indexOf('--component');
  return {
    all: argv.includes('--all'),
    list: argv.includes('--list'),
    component: componentIdx !== -1 ? argv[componentIdx + 1] : undefined,
  };
}

function pickRandom<T>(items: T[]): T {
  const item = items[Math.floor(Math.random() * items.length)];
  if (!item) throw new Error('pickRandom() called with an empty array');
  return item;
}

function printResult(result: VibeTestResult): void {
  const status = result.pass ? 'PASS' : 'FAIL';
  console.log(`\n[${status}] ${result.title}  (${result.category}/${result.slug})`);

  if (!result.pass) {
    console.log('  What the model got wrong (real tsc diagnostics):');
    for (const line of result.diagnostics) {
      console.log(`    ${line}`);
    }
    console.log('  --- generated code ---');
    console.log(
      result.code
        .split('\n')
        .map((l) => `    ${l}`)
        .join('\n'),
    );
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const index = loadGuidelineIndex(repoRoot);

  if (args.list) {
    for (const g of index) {
      console.log(`${g.slug}\t${g.category}/${g.file}\t${g.title}`);
    }
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Set ANTHROPIC_API_KEY to run this — see docs/COMPONENTS.md (full write-up: docs/vibe-test.md).');
    process.exitCode = 1;
    return;
  }

  let targets: ComponentGuideline[];
  if (args.all) {
    targets = index;
  } else if (args.component) {
    const match = index.find((g) => g.slug === args.component);
    if (!match) {
      console.error(`No guideline found for --component "${args.component}". Run with --list to see available slugs.`);
      process.exitCode = 1;
      return;
    }
    targets = [match];
  } else {
    targets = [pickRandom(index)];
  }

  const generate = createAnthropicGenerate(apiKey);
  const results: VibeTestResult[] = [];

  for (const guideline of targets) {
    // Sequential on purpose: keeps API usage predictable/rate-limit-friendly
    // and keeps the printed report ordered.
    const result = await runVibeTestForComponent(guideline, generate, repoRoot);
    results.push(result);
    printResult(result);
  }

  const passCount = results.filter((r) => r.pass).length;
  console.log(`\n${passCount}/${results.length} passed.`);

  process.exitCode = passCount === results.length ? 0 : 1;
}

main().catch((err: unknown) => {
  console.error('vibe-test crashed:', err);
  process.exitCode = 1;
});
