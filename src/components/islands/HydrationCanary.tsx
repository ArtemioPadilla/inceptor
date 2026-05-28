import * as React from 'react';
import { buildIssueUrl, buildErrorReportBody } from '@/lib/report-issue';

/**
 * Single-mount island that listens for window 'error' events and detects
 * React's known hydration-mismatch message signatures. When a mismatch is
 * detected, it stores a pre-filled GitHub issue URL in sessionStorage under
 * the key 'feedbackfab.pending-report'. The FeedbackFAB reads this key on
 * open and uses the stored URL in preference to the generic form.
 *
 * Why sessionStorage instead of a Nano Store? The FAB is an Astro component
 * (not a React island) and its click handler runs in a plain <script>. Using
 * sessionStorage keeps the coupling zero: no shared module, no imports. The
 * FAB script reads the key and clears it so the report is only offered once
 * per session.
 *
 * This component renders null — it has no visible output.
 */
export default function HydrationCanary() {
  React.useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const msg = String(event.message ?? '');
      // React 18/19 hydration mismatch messages:
      //   "Hydration failed because the initial UI does not match…"
      //   "Text content does not match server-rendered HTML"
      //   Minified production errors: #418 (hydration), #421, #422
      if (
        /Hydration failed/i.test(msg) ||
        /Text content does not match/i.test(msg) ||
        /Minified React error #418|#421|#422/.test(msg)
      ) {
        const url = buildIssueUrl({
          title: '[bug] React hydration mismatch',
          body: buildErrorReportBody({
            error: new Error(msg),
            hydrationMismatch: true,
          }),
          labels: ['bug'],
        });
        sessionStorage.setItem('feedbackfab.pending-report', url);
      }
    };

    window.addEventListener('error', onError);
    return () => window.removeEventListener('error', onError);
  }, []);

  // Renders nothing — purely a side-effect island.
  return null;
}
