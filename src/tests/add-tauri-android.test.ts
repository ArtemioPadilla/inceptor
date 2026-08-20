import { describe, it, expect } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readTauriConfig, patchAndroidConfig, main } from '../../scripts/add-tauri-android.mjs';

const SAMPLE_DESKTOP_CONFIG = {
  $schema: 'https://schema.tauri.app/config/2',
  productName: 'Scratch App',
  version: '0.1.0',
  identifier: 'com.example.scratch',
  build: {
    frontendDist: '../dist',
    devUrl: 'http://localhost:4321',
    beforeDevCommand: 'npm run dev',
    beforeBuildCommand: 'npm run build',
  },
  app: { windows: [{ title: 'Scratch App', width: 1024, height: 768, resizable: true, fullscreen: false }] },
  bundle: {
    active: true,
    icon: ['icons/32x32.png', 'icons/128x128.png', 'icons/128x128@2x.png', 'icons/icon.icns', 'icons/icon.ico'],
  },
};

describe('readTauriConfig', () => {
  it('reads and parses an existing src-tauri/tauri.conf.json', () => {
    const dir = mkdtempSync(join(tmpdir(), 'add-tauri-android-'));
    try {
      mkdirSync(join(dir, 'src-tauri'), { recursive: true });
      writeFileSync(join(dir, 'src-tauri/tauri.conf.json'), JSON.stringify(SAMPLE_DESKTOP_CONFIG));
      const config = readTauriConfig(dir);
      expect(config.identifier).toBe('com.example.scratch');
      expect(config.productName).toBe('Scratch App');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('throws a recognizable error (.code === "ENOTAURI") when src-tauri/tauri.conf.json is missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'add-tauri-android-'));
    try {
      expect(() => readTauriConfig(dir)).toThrow();
      try {
        readTauriConfig(dir);
      } catch (err: any) {
        expect(err.code).toBe('ENOTAURI');
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('patchAndroidConfig', () => {
  it('adds bundle.android.minSdkVersion cleanly with no warning when absent', () => {
    const { config, warning } = patchAndroidConfig(SAMPLE_DESKTOP_CONFIG, 24);
    expect(config.bundle.android).toEqual({ minSdkVersion: 24 });
    expect(warning).toBeNull();
  });

  it('does not mutate the input config', () => {
    patchAndroidConfig(SAMPLE_DESKTOP_CONFIG, 24);
    expect(SAMPLE_DESKTOP_CONFIG.bundle).not.toHaveProperty('android');
  });

  it('warns and preserves an existing different minSdkVersion instead of overwriting', () => {
    const existing = {
      ...SAMPLE_DESKTOP_CONFIG,
      bundle: { ...SAMPLE_DESKTOP_CONFIG.bundle, android: { minSdkVersion: 26 } },
    };
    const { config, warning } = patchAndroidConfig(existing, 24);
    expect(config.bundle.android.minSdkVersion).toBe(26);
    expect(warning).toMatch(/minSdkVersion/);
  });

  it('is a no-op (no warning) when the existing minSdkVersion already matches', () => {
    const existing = {
      ...SAMPLE_DESKTOP_CONFIG,
      bundle: { ...SAMPLE_DESKTOP_CONFIG.bundle, android: { minSdkVersion: 24 } },
    };
    const { config, warning } = patchAndroidConfig(existing, 24);
    expect(config.bundle.android.minSdkVersion).toBe(24);
    expect(warning).toBeNull();
  });
});

describe('add-tauri-android CLI (end-to-end)', () => {
  it('patches tauri.conf.json and adds npm scripts in a real target directory', () => {
    const dir = mkdtempSync(join(tmpdir(), 'add-tauri-android-'));
    try {
      mkdirSync(join(dir, 'src-tauri'), { recursive: true });
      writeFileSync(join(dir, 'src-tauri/tauri.conf.json'), JSON.stringify(SAMPLE_DESKTOP_CONFIG, null, 2));
      writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify({ name: 'scratch-app', scripts: { dev: 'astro dev' }, devDependencies: { '@tauri-apps/cli': '^2' } }),
      );

      const cwd = process.cwd();
      process.chdir(dir);
      try {
        main([]);
      } finally {
        process.chdir(cwd);
      }

      const tauriConf = JSON.parse(readFileSync(join(dir, 'src-tauri/tauri.conf.json'), 'utf8'));
      expect(tauriConf.bundle.android.minSdkVersion).toBe(24);
      expect(tauriConf.identifier).toBe('com.example.scratch'); // untouched

      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
      expect(pkg.scripts['tauri:android:init']).toBe('tauri android init');
      expect(pkg.scripts['tauri:android:dev']).toBe('tauri android dev');
      expect(pkg.scripts['tauri:android:build']).toBe('tauri android build --aab');

      expect(existsSync(join(dir, 'docs/runbooks/tauri-android.md'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits 1 with a clear message when src-tauri/tauri.conf.json does not exist', () => {
    const dir = mkdtempSync(join(tmpdir(), 'add-tauri-android-'));
    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => {
      exitCode = code;
      throw new Error('exit');
    };
    try {
      const cwd = process.cwd();
      process.chdir(dir);
      try {
        expect(() => main([])).toThrow();
      } finally {
        process.chdir(cwd);
      }
      expect(exitCode).toBe(1);
    } finally {
      process.exit = originalExit;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits 1 and leaves tauri.conf.json byte-for-byte unchanged when package.json is missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'add-tauri-android-'));
    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => {
      exitCode = code;
      throw new Error('exit');
    };
    try {
      mkdirSync(join(dir, 'src-tauri'), { recursive: true });
      writeFileSync(join(dir, 'src-tauri/tauri.conf.json'), JSON.stringify(SAMPLE_DESKTOP_CONFIG, null, 2));
      // deliberately no package.json written in `dir`
      const before = readFileSync(join(dir, 'src-tauri/tauri.conf.json'), 'utf8');

      const cwd = process.cwd();
      process.chdir(dir);
      try {
        expect(() => main([])).toThrow();
      } finally {
        process.chdir(cwd);
      }
      expect(exitCode).toBe(1);

      const after = readFileSync(join(dir, 'src-tauri/tauri.conf.json'), 'utf8');
      expect(after).toBe(before);
    } finally {
      process.exit = originalExit;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
