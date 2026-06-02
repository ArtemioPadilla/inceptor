import { describe, expect, it } from 'vitest';
import source from './PrivacyToast.tsx?raw';

describe('PrivacyToast', () => {
  it('reads and writes the inceptor:privacy-ack localStorage key', () => {
    expect(source).toMatch(/inceptor:privacy-ack/);
    expect(source).toMatch(/localStorage\.getItem\(\s*ACK_KEY\s*\)/);
    expect(source).toMatch(/localStorage\.setItem\(\s*ACK_KEY\s*,\s*['"]true['"]\s*\)/);
  });

  it('renders nothing once acknowledged (gated on visible state)', () => {
    expect(source).toMatch(/if\s*\(\s*!visible\s*\)\s*return\s*null/);
  });

  it('is wrapped in the shared ErrorBoundary', () => {
    expect(source).toMatch(/from ['"]\.\/ErrorBoundary['"]/);
    expect(source).toMatch(/<ErrorBoundary/);
  });

  it('shows the privacy disclosure copy and a dismiss control', () => {
    expect(source).toMatch(/Diagnostics are captured locally and only sent if you open an issue\./);
    expect(source).toMatch(/Got it/);
  });

  it('respects prefers-reduced-motion', () => {
    expect(source).toMatch(/motion-reduce:motion-none/);
  });

  it('is not a third-party tracker — no network calls or external scripts', () => {
    // No outbound requests: the notice is purely local. If any of these appear
    // the component is doing something it should not.
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/XMLHttpRequest/);
    expect(source).not.toMatch(/navigator\.sendBeacon/);
    expect(source).not.toMatch(/new Image\s*\(/);
    expect(source).not.toMatch(/import\s+.*from\s+['"]https?:\/\//);
    // No third-party analytics vendors.
    expect(source).not.toMatch(/google-analytics|googletagmanager|gtag|segment|mixpanel|amplitude/i);
  });

  it('does not import from framer-motion', () => {
    expect(source).not.toMatch(/from ['"]framer-motion['"]/);
  });
});
