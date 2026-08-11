// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
import { Splitter, SplitterPanel, SplitterResizeTrigger, type SplitterPanelConfig } from './splitter';
import source from './splitter.tsx?raw';

const PANELS: SplitterPanelConfig[] = [
  { id: 'a', defaultSize: 50, minSize: 20, maxSize: 80 },
  { id: 'b', defaultSize: 50, minSize: 20, maxSize: 80 },
];

// jsdom has no layout engine — @zag-js/splitter measures the root element via
// getBoundingClientRect() to resolve percentage sizes, and bails out (leaving
// sizes unresolved) when it reads a 0×0 rect. Stub a fixed size so the real
// state machine can compute real numbers instead of no-op'ing.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 400,
    height: 300,
    top: 0,
    left: 0,
    right: 400,
    bottom: 300,
    x: 0,
    y: 0,
    toJSON() {
      return {};
    },
  } as DOMRect);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function TwoPaneSplitter({ onResize }: { onResize?: (details: { size: number[] }) => void }) {
  return (
    <Splitter panels={PANELS} onResize={onResize}>
      <SplitterPanel id="a">Left pane</SplitterPanel>
      <SplitterResizeTrigger id="a:b" />
      <SplitterPanel id="b">Right pane</SplitterPanel>
    </Splitter>
  );
}

describe('Splitter', () => {
  it('renders both panels and a keyboard-focusable resize handle', () => {
    render(<TwoPaneSplitter />);
    expect(screen.getByText('Left pane')).toBeInTheDocument();
    expect(screen.getByText('Right pane')).toBeInTheDocument();

    const trigger = screen.getByRole('separator');
    expect(trigger).toHaveAttribute('tabindex', '0');
    expect(trigger).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('resizes panels via arrow keys on the focused resize trigger (keyboard resize contract)', async () => {
    const onResize = vi.fn();
    render(<TwoPaneSplitter onResize={onResize} />);

    const trigger = screen.getByRole('separator');
    // Let the initial mount settle so aria-valuenow reflects the resolved
    // `defaultSize` (the machine deliberately does NOT fire onResize for
    // this first, non-user-driven sync — see @zag-js/splitter's
    // `suppressOnResize` ref).
    await waitFor(() => expect(trigger).toHaveAttribute('aria-valuenow', '50'));

    fireEvent.focus(trigger);
    fireEvent.keyDown(trigger, { key: 'ArrowRight' });

    // A user-driven (keyboard) resize DOES fire onResize, and moves the
    // panel split away from the 50/50 default.
    await waitFor(() => expect(onResize).toHaveBeenCalled());
    expect(onResize.mock.calls[0]![0].size).not.toEqual([50, 50]);
    await waitFor(() => expect(trigger).not.toHaveAttribute('aria-valuenow', '50'));
  });

  it('does not import from @ark-ui/react (ADR 0009: scoped @zag-js/* only)', () => {
    expect(source).not.toMatch(/from\s+['"]@ark-ui\/react/);
  });

  // Accessibility bug fix: @zag-js/splitter's getResizeTriggerProps() sets
  // role="separator" and full keyboard/ARIA-value wiring, but never an
  // accessible name (no aria-label/aria-labelledby). Without a caller-supplied
  // label, a keyboard/screen-reader user tabbing to the handle hears only
  // "separator, N percent" with no indication of what it resizes.
  it('accepts an aria-label and exposes it as the resize trigger\'s accessible name', () => {
    render(
      <Splitter panels={PANELS}>
        <SplitterPanel id="a">Left pane</SplitterPanel>
        <SplitterResizeTrigger id="a:b" aria-label="Resize left and right panes" />
        <SplitterPanel id="b">Right pane</SplitterPanel>
      </Splitter>,
    );

    const trigger = screen.getByRole('separator', { name: 'Resize left and right panes' });
    expect(trigger).toBeInTheDocument();
  });
});
