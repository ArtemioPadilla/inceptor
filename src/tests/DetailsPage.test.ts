import { describe, expect, it } from 'vitest';
import simpleSource from '../components/islands/DetailsPageSimple.tsx?raw';
import tabbedSource from '../components/islands/DetailsPageWithTabs.tsx?raw';

describe('DetailsPageSimple', () => {
  it('default-exports a React component', () => {
    expect(simpleSource).toMatch(/export default function DetailsPageSimple/);
  });

  it('wraps inner component in ErrorBoundary', () => {
    expect(simpleSource).toMatch(/ErrorBoundary/);
    expect(simpleSource).toMatch(/name=["']DetailsPageSimple["']/);
  });

  it('accepts DetailsPageSimpleProps', () => {
    expect(simpleSource).toMatch(/DetailsPageSimpleProps/);
  });

  it('renders loading skeleton state', () => {
    expect(simpleSource).toMatch(/SimpleDetailsSkeleton|loading.*skeleton|aria-busy/i);
    expect(simpleSource).toMatch(/loading/);
  });

  it('renders empty state', () => {
    expect(simpleSource).toMatch(/SimpleDetailsEmpty|emptyMessage|empty/);
  });

  it('renders error state with retry', () => {
    expect(simpleSource).toMatch(/SimpleDetailsError|error/);
    expect(simpleSource).toMatch(/onRetry|Retry/);
  });

  it('accepts summaryBlocks prop', () => {
    expect(simpleSource).toMatch(/summaryBlocks/);
  });

  it('accepts relatedItems prop', () => {
    expect(simpleSource).toMatch(/relatedItems/);
  });

  it('accepts status prop and renders a badge', () => {
    expect(simpleSource).toMatch(/status/);
    expect(simpleSource).toMatch(/Badge/);
  });

  it('accepts actions prop', () => {
    expect(simpleSource).toMatch(/actions/);
  });

  it('does not import from @radix-ui', () => {
    expect(simpleSource).not.toMatch(/from ['"]@radix-ui/);
  });

  it('does not import framer-motion', () => {
    expect(simpleSource).not.toMatch(/from ['"]framer-motion['"]/);
  });

  it('uses semantic HTML — article with aria-label for the details region', () => {
    expect(simpleSource).toMatch(/<article/);
    expect(simpleSource).toMatch(/aria-label=\{label\}/);
  });
});

describe('DetailsPageWithTabs', () => {
  it('default-exports a React component', () => {
    expect(tabbedSource).toMatch(/export default function DetailsPageWithTabs/);
  });

  it('wraps inner component in ErrorBoundary', () => {
    expect(tabbedSource).toMatch(/ErrorBoundary/);
    expect(tabbedSource).toMatch(/name=["']DetailsPageWithTabs["']/);
  });

  it('accepts TabDefinition array for tabs prop', () => {
    expect(tabbedSource).toMatch(/TabDefinition/);
    expect(tabbedSource).toMatch(/tabs.*TabDefinition\[\]/);
  });

  it('uses Tabs compound component from ui library', () => {
    expect(tabbedSource).toMatch(/from ['"]@\/components\/ui\/tabs['"]/);
    expect(tabbedSource).toMatch(/TabsList/);
    expect(tabbedSource).toMatch(/TabsTrigger/);
    expect(tabbedSource).toMatch(/TabsContent/);
  });

  it('manages active tab state internally', () => {
    expect(tabbedSource).toMatch(/activeTab/);
    expect(tabbedSource).toMatch(/setActiveTab/);
  });

  it('accepts defaultTab prop', () => {
    expect(tabbedSource).toMatch(/defaultTab/);
  });

  it('renders loading skeleton state', () => {
    expect(tabbedSource).toMatch(/TabbedDetailsSkeleton|loading.*skeleton|aria-busy/i);
    expect(tabbedSource).toMatch(/loading/);
  });

  it('renders empty state', () => {
    expect(tabbedSource).toMatch(/TabbedDetailsEmpty|empty/);
  });

  it('renders error state', () => {
    expect(tabbedSource).toMatch(/TabbedDetailsError|error/);
    expect(tabbedSource).toMatch(/onRetry|Retry/);
  });

  it('does not import from @radix-ui', () => {
    expect(tabbedSource).not.toMatch(/from ['"]@radix-ui/);
  });

  it('does not import framer-motion', () => {
    expect(tabbedSource).not.toMatch(/from ['"]framer-motion['"]/);
  });

  it('does not use createContext for cross-island state', () => {
    expect(tabbedSource).not.toMatch(/createContext/);
  });

  it('accepts status prop and renders Badge', () => {
    expect(tabbedSource).toMatch(/status/);
    expect(tabbedSource).toMatch(/Badge/);
  });
});
