/**
 * Build-time extractor for component Props interfaces.
 *
 * Uses the TypeScript compiler API (already a devDependency) to parse
 * source files and extract exported interfaces ending in "Props". The
 * result is plain JSON — no runtime cost, no client-side JS shipped.
 *
 * Design constraints:
 * - Never throws; on any parse failure returns [] so the build never breaks.
 * - Uses the TS compiler in a lightweight "script" mode (no full program
 *   type-checking) — purely syntactic extraction for speed.
 * - Runs exclusively in Astro frontmatter (Node environment).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';

/** A single prop extracted from a *Props interface. */
export interface PropDoc {
  name: string;
  /** Raw TypeScript type text, possibly truncated. Full text in `fullType`. */
  type: string;
  /** Full untruncated type text for the `title` attribute tooltip. */
  fullType: string;
  optional: boolean;
  /** Default value from destructuring or @default JSDoc tag. */
  defaultValue: string;
  /** JSDoc description comment. */
  description: string;
}

/** One extracted Props interface. */
export interface ComponentPropsTable {
  /** Interface name, e.g. "ButtonProps". */
  interfaceName: string;
  props: PropDoc[];
}

const MAX_TYPE_LEN = 60;

/** Truncate type text so it doesn't blow the table layout. */
function truncateType(text: string): string {
  if (text.length <= MAX_TYPE_LEN) return text;
  return text.slice(0, MAX_TYPE_LEN - 1) + '…';
}

// Type for nodes that carry jsDoc — typed as a plain record to avoid
// the ts.HasJSDoc structural mismatch in TypeScript 6 (TS2339).
type NodeWithJsDoc = ts.Node & { jsDoc?: ts.JSDoc[] };

/** Extract text of a JSDoc tag named `@default` from a node's JSDoc. */
function extractDefaultTag(node: ts.Node): string {
  const jsDocs = (node as NodeWithJsDoc).jsDoc;
  if (!Array.isArray(jsDocs)) return '';
  for (const doc of jsDocs) {
    if (!doc.tags) continue;
    for (const tag of doc.tags) {
      if (tag.tagName.text === 'default') {
        // tag.comment can be a string or NodeArray<JSDocComment>
        const comment = tag.comment;
        if (typeof comment === 'string') return comment.trim();
        if (Array.isArray(comment)) {
          return comment.map((c: ts.JSDocComment) => ('text' in c ? c.text : '')).join('').trim();
        }
      }
    }
  }
  return '';
}

/** Extract the leading JSDoc description text from a node. */
function extractDescription(node: ts.Node): string {
  const jsDocs = (node as NodeWithJsDoc).jsDoc;
  if (!Array.isArray(jsDocs)) return '';
  const texts: string[] = [];
  for (const doc of jsDocs) {
    if (typeof doc.comment === 'string' && doc.comment.trim()) {
      texts.push(doc.comment.trim());
    } else if (Array.isArray(doc.comment)) {
      const t = (doc.comment as ts.JSDocComment[])
        .map((c) => ('text' in c ? c.text : ''))
        .join('')
        .trim();
      if (t) texts.push(t);
    }
  }
  return texts.join(' ');
}

/**
 * Extract the default value for a prop from the component function's
 * destructuring pattern. For example:
 *   function Foo({ size = 'default', variant = 'primary' }: FooProps)
 * returns { size: "'default'", variant: "'primary'" }.
 *
 * We walk the AST looking for parameter destructuring patterns where the
 * type annotation references `interfaceName`.
 */
function extractDestructuringDefaults(
  sourceFile: ts.SourceFile,
  interfaceName: string,
): Map<string, string> {
  const defaults = new Map<string, string>();

  function visit(node: ts.Node): void {
    // Match function declarations, arrow functions, and React.forwardRef calls
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node)
    ) {
      for (const param of node.parameters) {
        // Check if type annotation references our interface
        const typeRef = param.type;
        let refersToInterface = false;
        if (typeRef) {
          const typeText = typeRef.getText(sourceFile);
          // Match exact interface name or generic variant e.g. DataTableProps<TData, TValue>
          if (
            typeText === interfaceName ||
            typeText.startsWith(interfaceName + '<')
          ) {
            refersToInterface = true;
          }
        }
        if (!refersToInterface) continue;

        // Walk the binding pattern for defaults
        if (ts.isObjectBindingPattern(param.name)) {
          for (const element of param.name.elements) {
            if (element.initializer && ts.isBindingElement(element)) {
              const propName = ts.isIdentifier(element.name)
                ? element.name.text
                : element.name.getText(sourceFile);
              const defaultText = element.initializer.getText(sourceFile).trim();
              defaults.set(propName, defaultText);
            }
          }
        }
      }
    }

    // Also handle forwardRef<Ref, Props>(({ ... }: Props, ref) => ...) patterns
    // The inner arrow function's first param may have destructuring
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'forwardRef'
    ) {
      // The render function is the first argument
      const renderFn = node.arguments[0];
      if (renderFn && (ts.isFunctionExpression(renderFn) || ts.isArrowFunction(renderFn))) {
        const firstParam = renderFn.parameters[0];
        if (firstParam) {
          // The type may be a type assertion or annotation on the destructuring
          let refersToInterface = false;
          if (firstParam.type) {
            const typeText = firstParam.type.getText(sourceFile);
            if (typeText === interfaceName || typeText.startsWith(interfaceName + '<')) {
              refersToInterface = true;
            }
          }
          // Also check if the binding pattern itself has a type cast: ({ className, ...}: Props)
          // Sometimes the param is typed inline without explicit type annotation
          if (!refersToInterface && firstParam.name) {
            // Heuristic: scan full param text for the interface name
            const fullParamText = firstParam.getFullText(sourceFile);
            if (fullParamText.includes(interfaceName)) {
              refersToInterface = true;
            }
          }
          // Fallback: always pull destructuring defaults since they're valid regardless
          // (we'll only associate them if the function params happen to match)
          if (ts.isObjectBindingPattern(firstParam.name)) {
            for (const element of firstParam.name.elements) {
              if (element.initializer && ts.isBindingElement(element)) {
                const propName = ts.isIdentifier(element.name)
                  ? element.name.text
                  : element.name.getText(sourceFile);
                const defaultText = element.initializer.getText(sourceFile).trim();
                // Store tentatively; will be used if refersToInterface confirmed
                if (refersToInterface) {
                  defaults.set(propName, defaultText);
                } else {
                  // Store anyway as a fallback — most files have one Props interface
                  defaults.set(propName, defaultText);
                }
              }
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return defaults;
}

/**
 * Parse one TypeScript source file and return all exported *Props interfaces.
 * Returns [] on any error (never throws).
 */
export function extractPropsFromFile(filePath: string): ComponentPropsTable[] {
  try {
    if (!fs.existsSync(filePath)) return [];

    const sourceText = fs.readFileSync(filePath, 'utf-8');

    const sourceFile = ts.createSourceFile(
      path.basename(filePath),
      sourceText,
      ts.ScriptTarget.ESNext,
      /* setParentNodes */ true,
      ts.ScriptKind.TSX,
    );

    const results: ComponentPropsTable[] = [];

    for (const statement of sourceFile.statements) {
      // We look for: export interface FooProps { ... }
      if (!ts.isInterfaceDeclaration(statement)) continue;

      const interfaceName = statement.name.text;
      if (!interfaceName.endsWith('Props')) continue;

      // Must be exported
      const isExported =
        statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
      if (!isExported) continue;

      // Extract defaults from destructuring in the same file
      const destructuringDefaults = extractDestructuringDefaults(sourceFile, interfaceName);

      const props: PropDoc[] = [];

      for (const member of statement.members) {
        if (!ts.isPropertySignature(member)) continue;

        const propName = ts.isIdentifier(member.name)
          ? member.name.text
          : member.name.getText(sourceFile);

        const optional = member.questionToken !== undefined;

        const fullType = member.type
          ? member.type.getText(sourceFile).replace(/\s+/g, ' ').trim()
          : 'unknown';

        const typeText = truncateType(fullType);

        // @default JSDoc tag wins over destructuring default
        const jsdocDefault = extractDefaultTag(member);
        const destructDefault = destructuringDefaults.get(propName) ?? '';
        const defaultValue = jsdocDefault || destructDefault;

        const description = extractDescription(member);

        props.push({
          name: propName,
          type: typeText,
          fullType,
          optional,
          defaultValue,
          description,
        });
      }

      if (props.length > 0) {
        results.push({ interfaceName, props });
      }
    }

    return results;
  } catch {
    // Never break the build — return empty on any error
    return [];
  }
}

/**
 * Resolve a gallery entry `source` path to one or more *.tsx files to extract
 * from. `repoRoot` is the absolute path to the repository root.
 *
 * If `source` points to a specific file, return just that file.
 * If `source` points to a directory, return all direct *.tsx files in it
 * (non-recursive, to avoid pulling in chart sub-files for the primitives bucket).
 * Always returns absolute paths.
 */
export function resolveSourceFiles(source: string, repoRoot: string): string[] {
  const abs = path.resolve(repoRoot, source);
  try {
    const stat = fs.statSync(abs);
    if (stat.isFile()) return [abs];
    if (stat.isDirectory()) {
      // Return direct .tsx children only (not subdirectories)
      return fs
        .readdirSync(abs)
        .filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
        .map((f) => path.join(abs, f));
    }
  } catch {
    // Path doesn't exist — return empty
  }
  return [];
}

/**
 * Convenience wrapper: given a gallery entry's `source` string and the repo
 * root, return all ComponentPropsTables across all resolved source files.
 *
 * Deduplicates by interfaceName (first occurrence wins).
 */
export function extractPropsForSource(source: string, repoRoot: string): ComponentPropsTable[] {
  const files = resolveSourceFiles(source, repoRoot);
  const seen = new Set<string>();
  const all: ComponentPropsTable[] = [];
  for (const file of files) {
    for (const table of extractPropsFromFile(file)) {
      if (!seen.has(table.interfaceName)) {
        seen.add(table.interfaceName);
        all.push(table);
      }
    }
  }
  return all;
}
