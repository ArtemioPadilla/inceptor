import * as React from 'react';
import { transform } from 'sucrase';

import { cn } from '@/lib/utils';
import { defaultPlaygroundScope } from '@/lib/playground-scope';

export interface PlaygroundProps {
  /**
   * Initial JSX/TSX snippet. Either a single JSX expression
   * (`<Button>Click me</Button>`) or, for multi-statement snippets that need
   * hooks/state, a sequence of statements ending in an explicit
   * `render(<Element />)` call.
   */
  initialCode: string;
  /** Extra scope entries merged on top of `defaultPlaygroundScope`. */
  scope?: Record<string, unknown>;
  className?: string;
}

interface RunResult {
  element: React.ReactNode;
  error: Error | null;
}

/**
 * Compiles one JSX/TSX snippet against a fixed scope and returns either the
 * resulting element or a readable Error — never throws. This is the
 * react-runner-style runner the ROADMAP scopes Playground to: sucrase
 * transpiles JSX+TS to plain JS (no bundler, no module resolution, no real
 * npm sandbox), then a plain `new Function` executes it with the scope's
 * keys bound as free variables.
 */
function runSnippet(rawCode: string, scope: Record<string, unknown>): RunResult {
  const trimmed = rawCode.trim();

  if (/^\s*(import|export)\b/m.test(trimmed)) {
    return {
      element: null,
      error: new Error(
        "Playground snippets can't use import/export — every component is already in scope. Just write <ComponentName /> directly.",
      ),
    };
  }

  // Bare-expression snippets (the common case) are auto-wrapped in render();
  // snippets that already call render() explicitly (needed for hooks/state,
  // where the code has statements before the final JSX) are left as-is.
  const prepared = /\brender\s*\(/.test(trimmed) ? trimmed : `render(\n${trimmed}\n);`;

  try {
    const { code: js } = transform(prepared, {
      transforms: ['jsx', 'typescript'],
      production: true,
    });

    let captured: React.ReactNode = null;
    const render = (el: React.ReactNode) => {
      captured = el;
    };

    const scopeKeys = Object.keys(scope);
    const scopeValues = scopeKeys.map((key) => scope[key]);

    // This *is* the runner — Playground's entire purpose is executing
    // user-typed code against a fixed scope with no bundler. `new Function`
    // returns the generic `Function` type (no call signature in lib.d.ts),
    // so it needs a cast to something invokable; the cast is narrow
    // (unknown[] -> void), not `any`.
    const run = new Function('React', 'render', ...scopeKeys, js) as unknown as (
      ...args: unknown[]
    ) => void;
    run(React, render, ...scopeValues);

    return { element: captured, error: null };
  } catch (err) {
    return { element: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Local, render-phase error boundary — deliberately NOT the app-wide
 * `<ErrorBoundary>` (src/components/islands/ErrorBoundary.tsx), which files
 * a pre-filled GitHub issue on catch. That's the wrong affordance here: "the
 * user's live-edited snippet has a typo" is the expected common case for a
 * playground, not a real bug worth reporting. Remounted by the parent via
 * `key={code}` so a corrected snippet always gets a clean boundary instead
 * of needing an explicit reset method.
 */
class RenderBoundary extends React.Component<
  { onError: (error: Error) => void; children: React.ReactNode },
  { hasError: boolean }
> {
  state: { hasError: boolean } = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    this.props.onError(error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/**
 * `<Playground>` — a react-runner-style, transpile-on-keystroke single-file
 * live editor (ROADMAP Epic 16). Scope resolved by the 2026-08 DX study:
 * skip full Sandpack/CodeSandbox-style in-browser bundling (wrong
 * cost/benefit for a "ship zero JS by default" static site) in favor of
 * transpiling one JSX/TSX snippet against a fixed
 * `{ React, @/components/ui/* }`-equivalent scope
 * (`defaultPlaygroundScope`, merged with the `scope` prop). Hydrate with
 * `client:visible`, same as every other gallery island.
 */
export default function Playground({ initialCode, scope, className }: PlaygroundProps) {
  const [code, setCode] = React.useState(initialCode);
  const [runtimeError, setRuntimeError] = React.useState<Error | null>(null);

  const mergedScope = React.useMemo(
    () => ({ ...defaultPlaygroundScope, ...scope }),
    [scope],
  );

  // Re-runs on every keystroke ("transpile-on-keystroke") — cheap, since
  // sucrase transpiles one small snippet, not a bundle.
  const { element, error: compileError } = React.useMemo(
    () => runSnippet(code, mergedScope),
    [code, mergedScope],
  );

  // Clear any previous render-phase error as soon as the code changes; the
  // RenderBoundary below is also remounted via `key={code}` for the same
  // "give the next attempt a clean slate" reason.
  React.useEffect(() => {
    setRuntimeError(null);
  }, [code]);

  const error = compileError ?? runtimeError;

  return (
    <div className={cn('grid gap-3 md:grid-cols-2', className)}>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          Edit the code — the preview updates as you type
        </p>
        <textarea
          aria-label="Playground code editor"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className={cn(
            'h-40 w-full resize-y rounded-md border border-input bg-background p-3 font-mono text-xs',
            'outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Preview</p>
        <div className="flex min-h-40 items-center justify-center rounded-md border border-border bg-card p-4">
          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error.message}
            </p>
          ) : (
            <RenderBoundary key={code} onError={setRuntimeError}>
              {element}
            </RenderBoundary>
          )}
        </div>
      </div>
    </div>
  );
}
