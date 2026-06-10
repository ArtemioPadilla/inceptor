import { describe, expect, it } from 'vitest';
import source from './ErrorBoundary.tsx?raw';

describe('ErrorBoundary', () => {
  it('uses static getDerivedStateFromError', () => {
    expect(source).toMatch(/static getDerivedStateFromError/);
  });

  it('uses componentDidCatch with ErrorInfo', () => {
    expect(source).toMatch(/componentDidCatch/);
    expect(source).toMatch(/ErrorInfo/);
  });

  it('builds an issue URL via buildIssueUrl', () => {
    expect(source).toMatch(/buildIssueUrl/);
  });

  it('renders an alert role fallback by default', () => {
    expect(source).toMatch(/role=["']alert["']/);
  });

  it('renders fallback as soon as error is set (not gated on reportUrl)', () => {
    // The critical fix: the render branch must be `error !== null`, NOT `error && reportUrl`.
    // The old `error && reportUrl` guard let the crashing child re-render during the
    // async gap between getDerivedStateFromError and componentDidCatch.
    expect(source).toMatch(/error !== null/);
    expect(source).not.toMatch(/error && reportUrl/);
  });

  it('shows the GitHub link only once reportUrl resolves (conditional inside fallback)', () => {
    // The "Report on GitHub" link is guarded by `{reportUrl &&` inside the fallback block,
    // not at the top-level render gate.
    expect(source).toMatch(/\{reportUrl && /);
  });

  it('imports from @/lib/report-issue (not a third-party tracker)', () => {
    expect(source).toMatch(/from ['"]@\/lib\/report-issue['"]/);
  });

  it('exports a default class component extending React.Component', () => {
    expect(source).toMatch(/export default class ErrorBoundary extends React\.Component/);
  });

  it('accepts an optional name prop for the component path', () => {
    expect(source).toMatch(/name\?/);
  });

  it('does not import from framer-motion', () => {
    expect(source).not.toMatch(/from ['"]framer-motion['"]/);
  });
});
