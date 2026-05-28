import { describe, expect, it } from 'vitest';
import source from './HydrationCanary.tsx?raw';

describe('HydrationCanary', () => {
  it('listens for window error events', () => {
    expect(source).toMatch(/window\.addEventListener\(['"]error['"]/);
  });

  it('removes the listener on cleanup (no leak)', () => {
    expect(source).toMatch(/window\.removeEventListener\(['"]error['"]/);
  });

  it('matches React hydration error signatures', () => {
    expect(source).toMatch(/Hydration failed/);
    expect(source).toMatch(/Text content does not match/);
  });

  it('matches minified React production error codes', () => {
    expect(source).toMatch(/Minified React error #418/);
  });

  it('writes to sessionStorage for FeedbackFAB pickup', () => {
    expect(source).toMatch(/sessionStorage\.setItem\(['"]feedbackfab\.pending-report['"]/);
  });

  it('imports from @/lib/report-issue', () => {
    expect(source).toMatch(/from ['"]@\/lib\/report-issue['"]/);
  });

  it('renders null (no visible output)', () => {
    expect(source).toMatch(/return null/);
  });

  it('does not import from framer-motion', () => {
    expect(source).not.toMatch(/from ['"]framer-motion['"]/);
  });
});
