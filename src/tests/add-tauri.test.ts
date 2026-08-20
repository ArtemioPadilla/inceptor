import { describe, it, expect } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  deriveNames,
  isValidIdentifier,
  isValidDerivedName,
  hasUnsafeNameChars,
  substitutePlaceholders,
  mergePackageJson,
  appendGitignoreSnippet,
  main,
} from '../../scripts/add-tauri.mjs';

describe('deriveNames', () => {
  it('derives a kebab-case slug and a snake_case _lib crate name', () => {
    expect(deriveNames('My App')).toEqual({ slug: 'my-app', libName: 'my_app_lib' });
  });

  it('strips characters outside [a-z0-9-] and collapses/trims dashes', () => {
    expect(deriveNames('  Weird!! Name_2  ')).toEqual({
      slug: 'weird-name-2',
      libName: 'weird_name_2_lib',
    });
  });

  it('produces an empty slug for input with no alphanumerics', () => {
    expect(deriveNames('!!!')).toEqual({ slug: '', libName: '_lib' });
  });

  it('produces a digit-leading libName for a purely numeric name', () => {
    expect(deriveNames('2048')).toEqual({ slug: '2048', libName: '2048_lib' });
  });
});

describe('isValidDerivedName', () => {
  it('rejects an empty slug (e.g. from deriveNames("!!!"))', () => {
    expect(isValidDerivedName(deriveNames('!!!'))).toBe(false);
  });

  it('rejects a digit-leading libName (e.g. from deriveNames("2048"))', () => {
    expect(isValidDerivedName(deriveNames('2048'))).toBe(false);
  });

  it('accepts a normal derived name', () => {
    expect(isValidDerivedName(deriveNames('My App'))).toBe(true);
  });
});

describe('hasUnsafeNameChars', () => {
  it('rejects a name with an embedded double quote', () => {
    expect(hasUnsafeNameChars('My "App"')).toBe(true);
  });

  it('rejects a name with a backslash', () => {
    expect(hasUnsafeNameChars('My\\App')).toBe(true);
  });

  it('rejects a name with a control character', () => {
    expect(hasUnsafeNameChars('My\x00App')).toBe(true);
  });

  it('accepts a normal name', () => {
    expect(hasUnsafeNameChars('My App')).toBe(false);
  });
});

describe('isValidIdentifier', () => {
  it('accepts a two-segment reverse-DNS identifier', () => {
    expect(isValidIdentifier('com.example.myapp')).toBe(true);
  });

  it('rejects a single-segment string (no dot)', () => {
    expect(isValidIdentifier('myapp')).toBe(false);
  });

  it('rejects uppercase characters', () => {
    expect(isValidIdentifier('Com.Example.MyApp')).toBe(false);
  });

  it('rejects a segment starting with a digit', () => {
    expect(isValidIdentifier('com.1example.myapp')).toBe(false);
  });
});

describe('substitutePlaceholders', () => {
  it('replaces every __KEY__ occurrence with its value', () => {
    const out = substitutePlaceholders('name: __NAME__, id: __IDENTIFIER__, again: __NAME__', {
      NAME: 'My App',
      IDENTIFIER: 'com.example.myapp',
    });
    expect(out).toBe('name: My App, id: com.example.myapp, again: My App');
  });

  it('leaves text with no matching placeholders untouched', () => {
    expect(substitutePlaceholders('nothing to replace', { NAME: 'x' })).toBe('nothing to replace');
  });
});

describe('mergePackageJson', () => {
  it('adds new devDependencies and scripts cleanly with no warnings', () => {
    const existing = {
      name: 'app',
      scripts: { dev: 'astro dev' },
      devDependencies: { typescript: '^5' },
    };
    const snippet = {
      devDependencies: { '@tauri-apps/cli': '^2' },
      scripts: { 'tauri:dev': 'tauri dev' },
    };
    const { merged, warnings } = mergePackageJson(existing, snippet);
    expect(merged.scripts).toEqual({ dev: 'astro dev', 'tauri:dev': 'tauri dev' });
    expect(merged.devDependencies).toEqual({ typescript: '^5', '@tauri-apps/cli': '^2' });
    expect(warnings).toEqual([]);
  });

  it('warns and preserves the existing value on a conflicting key instead of overwriting', () => {
    const existing = { scripts: { 'tauri:dev': 'echo custom' }, devDependencies: {} };
    const snippet = { devDependencies: {}, scripts: { 'tauri:dev': 'tauri dev' } };
    const { merged, warnings } = mergePackageJson(existing, snippet);
    expect(merged.scripts['tauri:dev']).toBe('echo custom');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/tauri:dev/);
  });

  it('does not mutate the input objects', () => {
    const existing = { scripts: {}, devDependencies: {} };
    const snippet = { devDependencies: { '@tauri-apps/cli': '^2' }, scripts: {} };
    mergePackageJson(existing, snippet);
    expect(existing.devDependencies).toEqual({});
  });
});

describe('appendGitignoreSnippet', () => {
  const snippet = '# Tauri desktop (added by scripts/add-tauri.mjs)\nsrc-tauri/target/\n';

  it('appends the snippet to existing gitignore content', () => {
    const out = appendGitignoreSnippet('node_modules/\ndist/\n', snippet);
    expect(out).toContain('node_modules/\ndist/\n');
    expect(out).toContain('src-tauri/target/');
  });

  it('is idempotent — running twice does not duplicate the block', () => {
    const once = appendGitignoreSnippet('node_modules/\n', snippet);
    const twice = appendGitignoreSnippet(once, snippet);
    expect(twice).toBe(once);
  });
});

describe('add-tauri CLI (end-to-end)', () => {
  it('scaffolds src-tauri/, merges package.json, and appends .gitignore in a real target directory', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'add-tauri-'));
    try {
      writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify({ name: 'scratch-app', scripts: { dev: 'astro dev' } }, null, 2),
      );
      writeFileSync(join(dir, '.gitignore'), 'node_modules/\n');

      const cwd = process.cwd();
      process.chdir(dir);
      try {
        main(['--name', 'Scratch App', '--identifier', 'com.example.scratch']);
      } finally {
        process.chdir(cwd);
      }

      expect(existsSync(join(dir, 'src-tauri/Cargo.toml'))).toBe(true);
      expect(existsSync(join(dir, 'src-tauri/tauri.conf.json'))).toBe(true);
      expect(existsSync(join(dir, 'docs/runbooks/tauri-desktop.md'))).toBe(true);

      const cargoToml = readFileSync(join(dir, 'src-tauri/Cargo.toml'), 'utf8');
      expect(cargoToml).toContain('name = "scratch-app"');
      expect(cargoToml).toContain('name = "scratch_app_lib"');

      const tauriConf = JSON.parse(readFileSync(join(dir, 'src-tauri/tauri.conf.json'), 'utf8'));
      expect(tauriConf.identifier).toBe('com.example.scratch');

      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
      expect(pkg.scripts.dev).toBe('astro dev'); // untouched
      expect(pkg.scripts['tauri:dev']).toBe('tauri dev'); // added

      const gitignore = readFileSync(join(dir, '.gitignore'), 'utf8');
      expect(gitignore).toContain('node_modules/');
      expect(gitignore).toContain('src-tauri/target/');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits(1) and creates no src-tauri/ when package.json is missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'add-tauri-'));
    const exitSpy: { code: unknown } = { code: null };
    const originalExit = process.exit;
    process.exit = (code) => {
      exitSpy.code = code;
      throw new Error('exit');
    };
    try {
      // deliberately no package.json written in `dir`
      const cwd = process.cwd();
      process.chdir(dir);
      try {
        expect(() => main(['--name', 'No Pkg', '--identifier', 'com.example.nopkg'])).toThrow();
        expect(exitSpy.code).toBe(1);
      } finally {
        process.chdir(cwd);
      }
      expect(existsSync(join(dir, 'src-tauri'))).toBe(false);
    } finally {
      process.exit = originalExit;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits(1) and creates no src-tauri/ when package.json is unparseable', () => {
    const dir = mkdtempSync(join(tmpdir(), 'add-tauri-'));
    const exitSpy: { code: unknown } = { code: null };
    const originalExit = process.exit;
    process.exit = (code) => {
      exitSpy.code = code;
      throw new Error('exit');
    };
    try {
      writeFileSync(join(dir, 'package.json'), '{ not valid json');
      const cwd = process.cwd();
      process.chdir(dir);
      try {
        expect(() => main(['--name', 'Bad Json', '--identifier', 'com.example.badjson'])).toThrow();
        expect(exitSpy.code).toBe(1);
      } finally {
        process.chdir(cwd);
      }
      expect(existsSync(join(dir, 'src-tauri'))).toBe(false);
    } finally {
      process.exit = originalExit;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits(1) for a --name that derives an invalid Rust identifier (e.g. "!!!")', () => {
    const dir = mkdtempSync(join(tmpdir(), 'add-tauri-'));
    const exitSpy: { code: unknown } = { code: null };
    const originalExit = process.exit;
    process.exit = (code) => {
      exitSpy.code = code;
      throw new Error('exit');
    };
    try {
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'x', scripts: {} }));
      const cwd = process.cwd();
      process.chdir(dir);
      try {
        expect(() => main(['--name', '!!!', '--identifier', 'com.example.bad'])).toThrow();
        expect(exitSpy.code).toBe(1);
      } finally {
        process.chdir(cwd);
      }
      expect(existsSync(join(dir, 'src-tauri'))).toBe(false);
    } finally {
      process.exit = originalExit;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits(1) for a --name containing an embedded double quote', () => {
    const dir = mkdtempSync(join(tmpdir(), 'add-tauri-'));
    const exitSpy: { code: unknown } = { code: null };
    const originalExit = process.exit;
    process.exit = (code) => {
      exitSpy.code = code;
      throw new Error('exit');
    };
    try {
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'x', scripts: {} }));
      const cwd = process.cwd();
      process.chdir(dir);
      try {
        expect(() => main(['--name', 'My "App"', '--identifier', 'com.example.quoted'])).toThrow();
        expect(exitSpy.code).toBe(1);
      } finally {
        process.chdir(cwd);
      }
      expect(existsSync(join(dir, 'src-tauri'))).toBe(false);
    } finally {
      process.exit = originalExit;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses to run twice without --force', () => {
    const dir = mkdtempSync(join(tmpdir(), 'add-tauri-'));
    const exitSpy: { code: unknown } = { code: null };
    const originalExit = process.exit;
    process.exit = (code) => {
      exitSpy.code = code;
      throw new Error('exit');
    };
    try {
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'x', scripts: {} }));
      const cwd = process.cwd();
      process.chdir(dir);
      try {
        main(['--name', 'X', '--identifier', 'com.example.x']);
        expect(() => main(['--name', 'X', '--identifier', 'com.example.x'])).toThrow();
        expect(exitSpy.code).toBe(1);
      } finally {
        process.chdir(cwd);
      }
    } finally {
      process.exit = originalExit;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
