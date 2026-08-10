// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppLayoutIsland from '../components/islands/AppLayoutIsland';

const navItems = [
  { id: 'home', label: 'Home', active: true },
  { id: 'settings', label: 'Settings' },
];

const secondaryNavItems = [
  { id: 'overview', label: 'Overview', active: true },
  { id: 'members', label: 'Members' },
];

describe('AppLayoutIsland — sidebarVariant="default" (unchanged)', () => {
  it('has no collapse toggle and no secondary nav', () => {
    render(<AppLayoutIsland navItems={navItems} />);
    expect(screen.queryByRole('button', { name: /collapse sidebar/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/contextual navigation/i)).not.toBeInTheDocument();
  });
});

describe('AppLayoutIsland — sidebarVariant="icon-collapse"', () => {
  it('nav labels are visible by default (expanded)', () => {
    render(<AppLayoutIsland navItems={navItems} sidebarVariant="icon-collapse" />);
    // getAllByText because the same label appears again in the (hidden) mobile drawer markup
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
  });

  it('clicking the collapse toggle hides nav labels from the desktop rail', async () => {
    const user = userEvent.setup();
    render(<AppLayoutIsland navItems={navItems} sidebarVariant="icon-collapse" />);

    const toggle = screen.getByRole('button', { name: /collapse sidebar/i });
    await user.click(toggle);

    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
  });

  it('clicking the toggle again re-expands the sidebar', async () => {
    const user = userEvent.setup();
    render(<AppLayoutIsland navItems={navItems} sidebarVariant="icon-collapse" />);

    await user.click(screen.getByRole('button', { name: /collapse sidebar/i }));
    await user.click(screen.getByRole('button', { name: /expand sidebar/i }));

    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();
  });
});

describe('AppLayoutIsland — sidebarVariant="dual"', () => {
  it('renders both the primary (icon rail) and secondary nav items', () => {
    render(
      <AppLayoutIsland
        navItems={navItems}
        sidebarVariant="dual"
        secondaryNavItems={secondaryNavItems}
      />,
    );
    expect(screen.getByLabelText(/contextual navigation/i)).toBeInTheDocument();
    expect(screen.getAllByText('Overview').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Members').length).toBeGreaterThan(0);
  });

  it('calls onSecondaryNavSelect when a secondary nav item is clicked', async () => {
    const user = userEvent.setup();
    const onSecondaryNavSelect = vi.fn();
    render(
      <AppLayoutIsland
        navItems={navItems}
        sidebarVariant="dual"
        secondaryNavItems={secondaryNavItems}
        onSecondaryNavSelect={onSecondaryNavSelect}
      />,
    );

    await user.click(screen.getByText('Members'));
    expect(onSecondaryNavSelect).toHaveBeenCalledWith('members');
  });
});
