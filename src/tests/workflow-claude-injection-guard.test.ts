/**
 * Validates that the Claude triage workflow enforces the prompt-injection
 * threat model documented in ADR 0007.
 *
 * These tests read the workflow file as text — they intentionally have no
 * runtime dependency on GitHub Actions and run under Vitest.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const WORKFLOW_PATH = resolve(process.cwd(), '.github/workflows/claude.yml');
const ADR_PATH = resolve(
  process.cwd(),
  'docs/decisions/0007-ai-triage-trust-model.md',
);

const workflow = readFileSync(WORKFLOW_PATH, 'utf-8');
const adr = readFileSync(ADR_PATH, 'utf-8');

describe('claude.yml — prompt-injection guard (#164)', () => {
  // -------------------------------------------------------------------------
  // Layer 1: Trust gating
  // -------------------------------------------------------------------------
  it('triggers on issues labeled event (ai-approved gate)', () => {
    expect(workflow).toContain('labeled');
  });

  it('restricts comment @claude to trusted author_associations only', () => {
    // The condition must check author_association for comments — it must
    // reference both OWNER and COLLABORATOR as the trust boundary.
    expect(workflow).toContain('author_association');
    expect(workflow).toContain('OWNER');
    expect(workflow).toContain('COLLABORATOR');
  });

  it('gates on ai-approved label for non-trusted openers', () => {
    expect(workflow).toContain('ai-approved');
  });

  it('does NOT trigger on issues opened unconditionally (all authors)', () => {
    // The old unconditional trigger was:
    //   types: [opened]
    // with NO author_association check in the job `if:`.
    // The new file must include an author_association check tied to `opened`.
    expect(workflow).toMatch(/opened[\s\S]*author_association/);
  });

  // -------------------------------------------------------------------------
  // Layer 2: Permissions floor
  // -------------------------------------------------------------------------
  it('keeps contents permission at read (invariant)', () => {
    expect(workflow).toMatch(/contents:\s*read/);
    // Must not contain contents: write
    expect(workflow).not.toMatch(/contents:\s*write/);
  });

  // -------------------------------------------------------------------------
  // Layer 3: Untrusted-data framing in custom_instructions
  // -------------------------------------------------------------------------
  it('custom_instructions contain untrusted-input framing', () => {
    expect(workflow).toMatch(/untrusted/i);
  });

  it('custom_instructions instruct model to stop on injection attempt', () => {
    // Must tell the model to STOP and flag — not act on injection attempts.
    expect(workflow).toMatch(/STOP/);
    expect(workflow).toMatch(/injection/i);
  });

  it('custom_instructions contain sensitive path deny-list', () => {
    expect(workflow).toContain('.github/workflows/**');
    expect(workflow).toContain('.github/actions/**');
    expect(workflow).toContain('SECURITY.md');
  });

  // -------------------------------------------------------------------------
  // ADR exists and references the issue
  // -------------------------------------------------------------------------
  it('ADR 0007 exists and documents the trust model', () => {
    expect(adr).toContain('trust');
    expect(adr).toContain('#164');
    expect(adr).toContain('author_association');
  });

  it('ADR documents all three layers', () => {
    expect(adr).toContain('Layer 1');
    expect(adr).toContain('Layer 2');
    expect(adr).toContain('Layer 3');
  });
});
