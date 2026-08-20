import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const TEMPLATE_ROOT = join(repoRoot, 'templates/tauri-desktop');

describe('templates/tauri-desktop scaffold', () => {
  const expectedFiles = [
    'src-tauri/Cargo.toml',
    'src-tauri/build.rs',
    'src-tauri/src/lib.rs',
    'src-tauri/src/main.rs',
    'src-tauri/capabilities/default.json',
    'src-tauri/tauri.conf.json.template',
    'gitignore.snippet',
    'package.snippet.json',
  ];

  it.each(expectedFiles)('%s exists', (rel) => {
    expect(existsSync(join(TEMPLATE_ROOT, rel))).toBe(true);
  });

  it('capabilities/default.json is valid JSON with only core:default', () => {
    const json = JSON.parse(readFileSync(join(TEMPLATE_ROOT, 'src-tauri/capabilities/default.json'), 'utf8'));
    expect(json.permissions).toEqual(['core:default']);
  });

  it('tauri.conf.json.template is valid JSON with no bundle.targets key', () => {
    const raw = readFileSync(join(TEMPLATE_ROOT, 'src-tauri/tauri.conf.json.template'), 'utf8')
      .replaceAll('__NAME__', 'Test App')
      .replaceAll('__IDENTIFIER__', 'com.example.testapp');
    const json = JSON.parse(raw);
    expect(json.bundle).not.toHaveProperty('targets');
    expect(json.identifier).toBe('com.example.testapp');
  });

  it('package.snippet.json is valid JSON with the three tauri scripts', () => {
    const json = JSON.parse(readFileSync(join(TEMPLATE_ROOT, 'package.snippet.json'), 'utf8'));
    expect(Object.keys(json.scripts)).toEqual(['tauri', 'tauri:dev', 'tauri:build']);
    expect(json.devDependencies['@tauri-apps/cli']).toBe('^2');
  });
});
