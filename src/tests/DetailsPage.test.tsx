// @vitest-environment jsdom
import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DetailsPageSimple from '../components/islands/DetailsPageSimple';
import DetailsPageWithTabs from '../components/islands/DetailsPageWithTabs';

// ── DetailsPageSimple ─────────────────────────────────────────────────────────

describe('DetailsPageSimple — loading state', () => {
  it('renders skeleton with aria-busy when loading=true', () => {
    render(<DetailsPageSimple loading={true} />);
    const skeleton = screen.getByLabelText(/loading resource details/i);
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });
});

describe('DetailsPageSimple — error state', () => {
  it('renders error message when error prop is provided', () => {
    render(<DetailsPageSimple error="Network error" />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders retry button and calls onRetry when clicked', async () => {
    const onRetry = vi.fn();
    render(<DetailsPageSimple error="Network error" onRetry={onRetry} />);
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe('DetailsPageSimple — empty state', () => {
  it('renders empty state message when empty=true', () => {
    render(<DetailsPageSimple empty={true} />);
    expect(screen.getByText(/no resource data found/i)).toBeInTheDocument();
  });

  it('shows custom emptyMessage when provided', () => {
    render(<DetailsPageSimple empty={true} emptyMessage="Nothing here yet." />);
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
  });
});

describe('DetailsPageSimple — content', () => {
  const summaryBlocks = [
    { label: 'Region', value: 'us-east-1' },
    { label: 'CPU', value: '4 vCPU' },
  ];
  const relatedItems = [
    { id: 'vpc-1', label: 'VPC-001', meta: 'virtual-network' },
    { id: 'sg-1', label: 'SG-001', href: '/sg/1' },
  ];

  it('renders title and status badge', () => {
    render(
      <DetailsPageSimple title="my-service" status="running" />,
    );
    expect(screen.getByText('my-service')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
  });

  it('renders summary blocks', () => {
    render(<DetailsPageSimple title="svc" summaryBlocks={summaryBlocks} />);
    expect(screen.getByText('Region')).toBeInTheDocument();
    expect(screen.getByText('us-east-1')).toBeInTheDocument();
    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('4 vCPU')).toBeInTheDocument();
  });

  it('renders related items', () => {
    render(<DetailsPageSimple title="svc" relatedItems={relatedItems} />);
    expect(screen.getByText('VPC-001')).toBeInTheDocument();
    expect(screen.getByText('virtual-network')).toBeInTheDocument();
    expect(screen.getByText('SG-001')).toBeInTheDocument();
  });

  it('renders article landmark with aria-label', () => {
    render(<DetailsPageSimple title="svc" label="My service details" />);
    expect(screen.getByRole('article', { name: 'My service details' })).toBeInTheDocument();
  });
});

// ── DetailsPageWithTabs ───────────────────────────────────────────────────────

const tabs = [
  { id: 'overview', label: 'Overview', content: <div>Overview content</div> },
  { id: 'logs', label: 'Logs', content: <div>Logs content</div> },
  { id: 'metrics', label: 'Metrics', content: <div>Metrics content</div> },
];

describe('DetailsPageWithTabs — loading/error/empty states', () => {
  it('renders skeleton with aria-busy when loading=true', () => {
    render(<DetailsPageWithTabs loading={true} tabs={tabs} />);
    const skeleton = screen.getByLabelText(/loading resource details/i);
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });

  it('renders error state', () => {
    render(<DetailsPageWithTabs error="Fetch failed" tabs={tabs} />);
    expect(screen.getByText('Fetch failed')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<DetailsPageWithTabs empty={true} tabs={tabs} />);
    expect(screen.getByText(/no resource data found/i)).toBeInTheDocument();
  });
});

describe('DetailsPageWithTabs — tabs', () => {
  it('renders all tab triggers', () => {
    render(<DetailsPageWithTabs title="svc" tabs={tabs} />);
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Logs' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Metrics' })).toBeInTheDocument();
  });

  it('first tab content is visible by default', () => {
    render(<DetailsPageWithTabs title="svc" tabs={tabs} />);
    expect(screen.getByText('Overview content')).toBeInTheDocument();
  });

  it('clicking a tab shows its content', async () => {
    const user = userEvent.setup();
    render(<DetailsPageWithTabs title="svc" tabs={tabs} />);

    const logsTab = screen.getByRole('tab', { name: 'Logs' });
    await user.click(logsTab);
    expect(screen.getByText('Logs content')).toBeVisible();
  });

  it('respects defaultTab prop', () => {
    render(<DetailsPageWithTabs title="svc" tabs={tabs} defaultTab="metrics" />);
    expect(screen.getByText('Metrics content')).toBeInTheDocument();
  });

  it('renders title and status badge', () => {
    render(<DetailsPageWithTabs title="my-svc" status="running" tabs={tabs} />);
    expect(screen.getByText('my-svc')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
  });
});
