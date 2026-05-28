import * as React from 'react';
import { buildIssueUrl, buildErrorReportBody } from '@/lib/report-issue';

interface ErrorBoundaryProps {
  /** Optional name shown in the report's component path. */
  name?: string;
  /**
   * Render-prop fallback. Receives the caught error + pre-filled GitHub issue
   * URL so callers can customise the recovery UI.
   */
  fallback?: (error: Error, reportUrl: string) => React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  reportUrl: string | null;
}

/**
 * Class-based React error boundary that catches rendering errors inside its
 * subtree and surfaces a fallback UI with a pre-filled GitHub issue link.
 *
 * Must be a class component — React's error boundary API (getDerivedStateFromError
 * + componentDidCatch) is intentionally not available as a hook.
 *
 * Usage:
 *   <ErrorBoundary name="IssuesList">
 *     <IssuesListInner />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null, reportUrl: null };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render shows the fallback UI.
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Build a report URL eagerly so the fallback can offer it immediately.
    // We derive a "component path" from the boundary name and the first line of
    // the React component stack (which React 19 produces in development).
    const stackFirstLine = info.componentStack?.split('\n')[1]?.trim() ?? '';
    const componentPath = [this.props.name, stackFirstLine]
      .filter(Boolean)
      .join(' › ');

    const url = buildIssueUrl({
      title: `[bug] ${error.name}: ${error.message}`,
      body: buildErrorReportBody({ error, componentPath, hydrationMismatch: false }),
      labels: ['bug'],
    });
    this.setState({ reportUrl: url });
  }

  render() {
    const { error, reportUrl } = this.state;

    if (error && reportUrl) {
      if (this.props.fallback) {
        return this.props.fallback(error, reportUrl);
      }

      // Default fallback: accessible alert with a "Report on GitHub" link.
      return (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <p className="font-medium">Something went wrong in this island.</p>
          <p className="mt-1 text-xs">
            <code>
              {error.name}: {error.message}
            </code>
          </p>
          <a
            href={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center rounded-md border border-destructive/40 bg-destructive/20 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/30"
          >
            Report on GitHub &rarr;
          </a>
        </div>
      );
    }

    return this.props.children;
  }
}
