/**
 * Validates the deploy-failure-issue workflow structure from issue #184.
 *
 * Tests read the workflow file as text — no runtime GitHub Actions dependency.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const WORKFLOW_PATH = resolve(
  process.cwd(),
  '.github/workflows/deploy-failure-issue.yml',
);
const workflow = readFileSync(WORKFLOW_PATH, 'utf-8');

describe('deploy-failure-issue.yml — auto-file issue on deploy failure (#184)', () => {
  // -------------------------------------------------------------------------
  // Trigger
  // -------------------------------------------------------------------------
  it('triggers on workflow_run for the Deploy workflow', () => {
    expect(workflow).toContain('workflow_run');
    expect(workflow).toContain('Deploy to GitHub Pages');
    expect(workflow).toContain('completed');
  });

  // -------------------------------------------------------------------------
  // Permissions (minimal — issues: write only)
  // -------------------------------------------------------------------------
  it('declares issues: write permission', () => {
    expect(workflow).toMatch(/issues:\s*write/);
  });

  it('does NOT declare contents: write (not needed)', () => {
    expect(workflow).not.toMatch(/contents:\s*write/);
  });

  // -------------------------------------------------------------------------
  // Failure path
  // -------------------------------------------------------------------------
  it('opens a new issue when there is no existing open deploy-failure issue', () => {
    expect(workflow).toContain('gh issue create');
    expect(workflow).toContain('deploy-failure');
  });

  it('includes the run URL in the issue body', () => {
    // RUN_URL env var is derived from github.event.workflow_run.id
    expect(workflow).toContain('RUN_URL');
    expect(workflow).toContain('workflow_run.id');
  });

  it('comments on existing open issue instead of creating a duplicate', () => {
    expect(workflow).toContain('gh issue comment');
    expect(workflow).toContain('find-issue');
  });

  it('labels new issues with deploy-failure and bug', () => {
    // The workflow uses $DEPLOY_LABEL (which is `deploy-failure`) plus bug,type:chore
    // so we assert both the label var and the supplemental labels are present.
    expect(workflow).toContain('DEPLOY_LABEL: deploy-failure');
    expect(workflow).toContain('$DEPLOY_LABEL,bug,type:chore');
  });

  // -------------------------------------------------------------------------
  // Success / close path
  // -------------------------------------------------------------------------
  it('closes the open tracking issue when deploy succeeds', () => {
    expect(workflow).toContain('gh issue close');
    expect(workflow).toContain("CONCLUSION == 'success'");
  });

  it('comments before closing so the thread is self-explanatory', () => {
    // The success path must comment before closing.
    const successBlock = workflow.slice(workflow.indexOf("CONCLUSION == 'success'"));
    expect(successBlock).toContain('gh issue comment');
    expect(successBlock).toContain('gh issue close');
    // comment step must appear before close step
    expect(successBlock.indexOf('gh issue comment')).toBeLessThan(
      successBlock.indexOf('gh issue close'),
    );
  });
});
