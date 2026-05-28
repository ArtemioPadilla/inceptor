import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function loadTpl(name: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../../.github/ISSUE_TEMPLATE/${name}`, import.meta.url)),
    'utf-8',
  );
}

const templates = [
  'add_component.yml',
  'add_dashboard.yml',
  'add_data_table.yml',
];

describe.each(templates)('%s', (file) => {
  const tpl = loadTpl(file);
  it('declares a name', () => {
    expect(tpl).toMatch(/^name:\s*/m);
  });
  it('declares labels (pre-applied)', () => {
    expect(tpl).toMatch(/^labels:\s*\n(\s*-\s*"[^"]+"\s*\n)+/m);
  });
  it('uses GitHub issue forms (body: array with type fields)', () => {
    expect(tpl).toMatch(/^body:\s*\n/m);
    expect(tpl).toMatch(/-\s*type:\s*(input|textarea|dropdown)/);
  });
  it('includes an acceptance criteria field', () => {
    expect(tpl.toLowerCase()).toMatch(/acceptance criteria/);
  });
});
