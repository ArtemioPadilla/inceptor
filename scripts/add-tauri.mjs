#!/usr/bin/env node
/**
 * add-tauri — layers an opt-in Tauri v2 desktop shell into the CURRENT
 * project (unlike scripts/init.mjs, which creates a brand-new project
 * elsewhere, this merges into an already-existing package.json/.gitignore
 * in place). See docs/superpowers/specs/2026-08-20-tauri-desktop-design.md.
 *
 *   node scripts/add-tauri.mjs --name "My App" --identifier com.example.myapp
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE_ROOT = join(ROOT, 'templates/tauri-desktop');

// --- pure helpers (exported for tests) --------------------------------------

export function deriveNames(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const libName = `${slug.replace(/-/g, '_')}_lib`;
  return { slug, libName };
}

export function isValidIdentifier(identifier) {
  return /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(identifier);
}

// A derived slug must be non-empty (a blank Cargo package name is a hard
// `cargo` error) and the derived _lib crate name must not start with a
// digit (Rust identifiers can't start with a digit — deriveNames('2048')
// would otherwise yield the invalid `2048_lib`).
export function isValidDerivedName({ slug, libName }) {
  if (!slug) return false;
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(libName)) return false;
  return true;
}

// Rejects characters that would break unescaped interpolation into
// tauri.conf.json (JSON) / Cargo.toml (TOML) — rather than implementing
// per-format escaping, we just refuse names that need it.
export function hasUnsafeNameChars(name) {
  return /["\\\x00-\x1f]/.test(name);
}

export function substitutePlaceholders(text, vars) {
  let out = text;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`__${key}__`, value);
  }
  return out;
}

export function mergePackageJson(existing, snippet) {
  const merged = JSON.parse(JSON.stringify(existing));
  const warnings = [];

  merged.devDependencies = merged.devDependencies || {};
  for (const [k, v] of Object.entries(snippet.devDependencies || {})) {
    if (merged.devDependencies[k] && merged.devDependencies[k] !== v) {
      warnings.push(
        `devDependency "${k}" already set to "${merged.devDependencies[k]}", leaving as-is (snippet wanted "${v}")`,
      );
    } else {
      merged.devDependencies[k] = v;
    }
  }

  merged.scripts = merged.scripts || {};
  for (const [k, v] of Object.entries(snippet.scripts || {})) {
    if (merged.scripts[k] && merged.scripts[k] !== v) {
      warnings.push(
        `script "${k}" already set to "${merged.scripts[k]}", leaving as-is (snippet wanted "${v}")`,
      );
    } else {
      merged.scripts[k] = v;
    }
  }

  return { merged, warnings };
}

export function appendGitignoreSnippet(existing, snippet) {
  const marker = snippet.split('\n')[0];
  if (existing.includes(marker)) return existing;
  const sep = existing === '' || existing.endsWith('\n') ? '' : '\n';
  return `${existing}${sep}\n${snippet}`;
}

// --- filesystem walk (not unit-tested directly — exercised by the
// integration test in Step 6 and by CI actually running the CLI) -----------

function listFilesRecursive(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listFilesRecursive(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function copyTemplateTree(vars) {
  const srcTauriTemplate = join(TEMPLATE_ROOT, 'src-tauri');
  for (const file of listFilesRecursive(srcTauriTemplate)) {
    const rel = file.slice(srcTauriTemplate.length + 1).replace(/\.template$/, '');
    const dest = join(process.cwd(), 'src-tauri', rel);
    mkdirSync(dirname(dest), { recursive: true });
    const text = substitutePlaceholders(readFileSync(file, 'utf8'), vars);
    writeFileSync(dest, text);
  }
}

// --- CLI ---------------------------------------------------------------

function parseArgs(argv) {
  const flag = (n, d = null) => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
  };
  return {
    name: flag('name'),
    identifier: flag('identifier'),
    force: argv.includes('--force'),
  };
}

export function main(argv = process.argv.slice(2)) {
  const { name, identifier, force } = parseArgs(argv);

  if (!name || !identifier) {
    console.error(
      '✗ Uso: node scripts/add-tauri.mjs --name "<Product Name>" --identifier <reverse.dns.id> [--force]',
    );
    process.exit(1);
  }
  if (!isValidIdentifier(identifier)) {
    console.error(
      `✗ --identifier inválido: "${identifier}" (esperado formato reverse-DNS, p. ej. com.example.myapp)`,
    );
    process.exit(1);
  }
  if (hasUnsafeNameChars(name)) {
    console.error(
      `✗ --name inválido: "${name}" no puede contener comillas (") barras invertidas (\\) ni caracteres de control — se interpola sin escapar en tauri.conf.json/Cargo.toml.`,
    );
    process.exit(1);
  }

  const cwd = process.cwd();
  const srcTauriDest = join(cwd, 'src-tauri');
  if (existsSync(srcTauriDest) && !force) {
    console.error(`✗ ${srcTauriDest} ya existe. Usa --force para sobrescribir.`);
    process.exit(1);
  }

  const derived = deriveNames(name);
  if (!isValidDerivedName(derived)) {
    console.error(
      `✗ --name "${name}" produce un identificador Rust/Cargo inválido (slug="${derived.slug}", libName="${derived.libName}"). Elige un --name con al menos un carácter alfanumérico que no empiece con un dígito.`,
    );
    process.exit(1);
  }
  const { slug, libName } = derived;

  // Preflight: package.json must exist and be valid JSON BEFORE we write
  // anything to disk — every other failure mode in this script fails
  // clean before touching the filesystem; writing a full src-tauri/ tree
  // ahead of a package.json read that then throws would be inconsistent.
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) {
    console.error(
      `✗ No se encontró ${pkgPath}. Ejecuta este script desde la raíz de un proyecto Node.`,
    );
    process.exit(1);
  }
  let existingPkg;
  try {
    existingPkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  } catch (err) {
    console.error(`✗ ${pkgPath} no es JSON válido: ${err.message}`);
    process.exit(1);
  }

  const vars = { NAME: name, IDENTIFIER: identifier, SLUG: slug, LIB_NAME: libName };

  console.log(`→ Agregando shell de escritorio Tauri a ${cwd}…`);
  copyTemplateTree(vars);

  // package.json merge
  const snippet = JSON.parse(readFileSync(join(TEMPLATE_ROOT, 'package.snippet.json'), 'utf8'));
  const { merged, warnings } = mergePackageJson(existingPkg, snippet);
  writeFileSync(pkgPath, JSON.stringify(merged, null, 2) + '\n');
  for (const w of warnings) console.warn(`⚠ ${w}`);

  // .gitignore append
  const gitignorePath = join(cwd, '.gitignore');
  const existingGitignore = existsSync(gitignorePath) ? readFileSync(gitignorePath, 'utf8') : '';
  const gitignoreSnippet = readFileSync(join(TEMPLATE_ROOT, 'gitignore.snippet'), 'utf8');
  writeFileSync(gitignorePath, appendGitignoreSnippet(existingGitignore, gitignoreSnippet));

  // runbook copy
  const runbookSrc = join(ROOT, 'docs/runbooks/tauri-desktop.md');
  const runbookDestDir = join(cwd, 'docs/runbooks');
  mkdirSync(runbookDestDir, { recursive: true });
  writeFileSync(join(runbookDestDir, 'tauri-desktop.md'), readFileSync(runbookSrc, 'utf8'));

  console.log('✓ Listo. Próximos pasos:');
  console.log('  npm install');
  console.log(
    '  npx tauri icon <path-to-a-512x512+-source.png>  (see docs/runbooks/tauri-desktop.md)',
  );
  console.log('  npm run tauri:dev');
  console.log('  Ver docs/runbooks/tauri-desktop.md para más detalle.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
