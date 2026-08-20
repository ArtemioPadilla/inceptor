#!/usr/bin/env node
/**
 * add-tauri-android — layers Android support onto a project that has
 * ALREADY run scripts/add-tauri.mjs (Epic 29a). Mobile targets share the
 * same src-tauri/ Cargo project desktop uses — this does not create a new
 * project, it patches tauri.conf.json's bundle.android block and adds
 * tauri:android:* npm scripts. See
 * docs/superpowers/specs/2026-08-20-tauri-mobile-android-design.md.
 *
 *   node scripts/add-tauri-android.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIN_SDK_VERSION = 24;

export function readTauriConfig(cwd) {
  const confPath = join(cwd, 'src-tauri/tauri.conf.json');
  if (!existsSync(confPath)) {
    const err = new Error(`No src-tauri/tauri.conf.json found in ${cwd}`);
    err.code = 'ENOTAURI';
    throw err;
  }
  return JSON.parse(readFileSync(confPath, 'utf8'));
}

export function patchAndroidConfig(config, minSdkVersion) {
  const next = JSON.parse(JSON.stringify(config));
  next.bundle = next.bundle || {};
  const current = next.bundle.android?.minSdkVersion;
  if (current !== undefined && current !== minSdkVersion) {
    return {
      config: next,
      warning: `bundle.android.minSdkVersion already set to ${current}, leaving as-is (wanted ${minSdkVersion})`,
    };
  }
  next.bundle.android = { ...next.bundle.android, minSdkVersion };
  return { config: next, warning: null };
}

export function main(argv = process.argv.slice(2)) {
  const cwd = process.cwd();

  let existingConfig;
  try {
    existingConfig = readTauriConfig(cwd);
  } catch (err) {
    if (err.code === 'ENOTAURI') {
      console.error('✗ Run "npm run add-tauri" first — no src-tauri/ project found.');
      process.exit(1);
    }
    throw err;
  }

  // Preflight: package.json must exist and be valid JSON BEFORE we write
  // anything to disk — mirrors add-tauri.mjs's own preflight (see its
  // comment around the existsSync(pkgPath) check). Without this, a missing
  // or unparseable package.json would throw only after tauri.conf.json had
  // already been patched, leaving the project half-mutated.
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) {
    console.error(`✗ No se encontró ${pkgPath}. Ejecuta este script desde la raíz de un proyecto Node.`);
    process.exit(1);
  }
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  } catch (err) {
    console.error(`✗ ${pkgPath} no es JSON válido: ${err.message}`);
    process.exit(1);
  }

  const { config, warning } = patchAndroidConfig(existingConfig, MIN_SDK_VERSION);
  if (warning) console.warn(`⚠ ${warning}`);
  writeFileSync(join(cwd, 'src-tauri/tauri.conf.json'), JSON.stringify(config, null, 2) + '\n');

  pkg.scripts = pkg.scripts || {};
  const wantedScripts = {
    'tauri:android:init': 'tauri android init',
    'tauri:android:dev': 'tauri android dev',
    'tauri:android:build': 'tauri android build --aab',
  };
  for (const [key, value] of Object.entries(wantedScripts)) {
    if (Object.hasOwn(pkg.scripts, key) && pkg.scripts[key] !== value) {
      console.warn(
        `⚠ script "${key}" already set to "${pkg.scripts[key]}", leaving as-is (wanted "${value}")`,
      );
    } else {
      pkg.scripts[key] = value;
    }
  }
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  const runbookSrc = join(ROOT, 'docs/runbooks/tauri-android.md');
  const runbookDestDir = join(cwd, 'docs/runbooks');
  mkdirSync(runbookDestDir, { recursive: true });
  writeFileSync(join(runbookDestDir, 'tauri-android.md'), readFileSync(runbookSrc, 'utf8'));

  console.log('✓ Android support added. Next: npm install, then see docs/runbooks/tauri-android.md.');
  console.log(`  App identifier (locked in at first Play Console upload): ${config.identifier}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
