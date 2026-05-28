import * as React from 'react';
import ErrorBoundary from './ErrorBoundary';

/**
 * Showcase island for the ErrorBoundary component.
 *
 * Renders a "Throw error" button that deliberately crashes a child component,
 * triggering the ErrorBoundary fallback with a pre-filled GitHub issue link.
 * This is the only place in the codebase where an error is thrown on purpose —
 * it exists purely to demonstrate the boundary in the /showcase page.
 */
function Bomber({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Deliberately thrown for showcase demo');
  }
  return (
    <p className="text-sm text-muted-foreground">
      No error — click the button to trigger the boundary.
    </p>
  );
}

export default function ShowcaseErrorBoundary() {
  const [shouldThrow, setShouldThrow] = React.useState(false);

  // Reset the boundary by unmounting + remounting via key change.
  const [resetKey, setResetKey] = React.useState(0);

  function triggerError() {
    setShouldThrow(true);
  }

  function resetBoundary() {
    setShouldThrow(false);
    setResetKey((k) => k + 1);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={triggerError}
          disabled={shouldThrow}
          className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          Throw error
        </button>
        {shouldThrow && (
          <button
            type="button"
            onClick={resetBoundary}
            className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Reset boundary
          </button>
        )}
      </div>
      <ErrorBoundary key={resetKey} name="ShowcaseDemo">
        <Bomber shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </div>
  );
}
