import * as React from 'react';
import ErrorBoundary from './ErrorBoundary';

/** localStorage key persisting the user's acknowledgement of the privacy notice. */
const ACK_KEY = 'inceptor:privacy-ack';

/**
 * First-load privacy disclosure (ROADMAP Epic 12 — ethics).
 *
 * A small fixed bottom-left card shown once per browser. It tells the user — in
 * plain language — that diagnostics are captured locally and only leave the
 * device if they choose to open an issue. This is a transparency affordance,
 * NOT a tracker: nothing is sent anywhere, and the only persistence is a single
 * boolean in localStorage so the card never nags a returning visitor.
 *
 * Mounted with `client:idle` in BaseLayout so it never blocks first paint;
 * position: fixed means it has no layout cost.
 *
 * Accessibility:
 * - role="status" + aria-live="polite" announces the notice without
 *   interrupting ongoing screen-reader speech.
 * - The dismiss button is a real <button> and is keyboard-focusable.
 * - The entrance animation is CSS-only (tailwindcss-motion) and is
 *   automatically suppressed under `prefers-reduced-motion: reduce` via the
 *   `motion-reduce:motion-none` utility.
 */
function PrivacyToastInner() {
  // Start hidden; reveal only after we confirm (client-side) it wasn't acked.
  // This avoids any SSR/hydration flash since the server can't read localStorage.
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    try {
      if (localStorage.getItem(ACK_KEY) !== 'true') {
        setVisible(true);
      }
    } catch (_) {
      // localStorage unavailable (private mode, disabled) — show the notice
      // anyway; worst case it reappears next visit, which is harmless.
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(ACK_KEY, 'true');
    } catch (_) {
      // Persisting failed — still dismiss for this session.
    }
    setVisible(false);
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 max-w-xs rounded-lg border border-border bg-card text-card-foreground px-4 py-3 shadow-lg backdrop-blur-sm motion-preset-slide-up-md motion-duration-300 motion-reduce:motion-none"
    >
      <p className="text-sm text-foreground">
        Diagnostics are captured locally and only sent if you open an issue.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="mt-2 inline-flex items-center rounded-md border border-primary/40 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Got it
      </button>
    </div>
  );
}

/**
 * Public island: the privacy notice wrapped in an ErrorBoundary so a render
 * fault here can never take down the page chrome.
 */
export default function PrivacyToast() {
  return (
    <ErrorBoundary name="PrivacyToast">
      <PrivacyToastInner />
    </ErrorBoundary>
  );
}
