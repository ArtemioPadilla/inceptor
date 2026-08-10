// Vitest global setup. Only matters for jsdom-environment tests (RTL renders).
// Node-environment tests skip this via the loader fast path.

// Polyfill `matchMedia` for jsdom (some components query it on mount).
if (typeof window !== 'undefined' && !window.matchMedia) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

// Polyfill `scrollIntoView` for jsdom — jsdom doesn't implement layout, so
// this never exists on Element.prototype. Needed by chat-style auto-scroll
// effects (e.g. ChatThread) that call it on every render.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Make @testing-library/jest-dom's custom matchers available everywhere.
import '@testing-library/jest-dom/vitest';
