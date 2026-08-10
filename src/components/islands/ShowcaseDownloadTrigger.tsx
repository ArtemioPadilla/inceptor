import * as React from 'react';
import { DownloadTrigger } from '@/components/ui/download-trigger';
import ErrorBoundary from './ErrorBoundary';

// Simulates a slow export (e.g. a server-side report render) so the loading
// state is visible. DownloadTrigger is standalone — it pairs naturally with
// DataTable (see its `onExport` prop) but composes into any export flow.
function buildReport(): Promise<Blob> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Blob(['id,name\n1,Alice\n2,Bob\n'], { type: 'text/csv' }));
    }, 900);
  });
}

export default function ShowcaseDownloadTrigger() {
  const [lastError, setLastError] = React.useState<string | null>(null);

  return (
    <ErrorBoundary name="ShowcaseDownloadTrigger">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Click to run a (simulated) async export — the button shows a
          loading spinner, then the browser downloads the resolved file.
        </p>
        <DownloadTrigger
          onExport={buildReport}
          filename="report.csv"
          label="Export CSV"
          onError={(err) => setLastError(err.message)}
        />
        {lastError && <p className="text-sm text-destructive">Export failed: {lastError}</p>}
      </div>
    </ErrorBoundary>
  );
}
