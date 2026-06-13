// @vitest-environment jsdom
import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppLayoutIsland from '../components/islands/AppLayoutIsland';

const navItems = [
  { id: 'home', label: 'Home', active: true },
  { id: 'settings', label: 'Settings' },
  { id: 'help', label: 'Help' },
];

describe('AppLayoutIsland — nav items', () => {
  it('renders all nav items', () => {
    render(<AppLayoutIsland navItems={navItems} />);
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Help').length).toBeGreaterThan(0);
  });

  it('active nav item has aria-current="page"', () => {
    render(<AppLayoutIsland navItems={navItems} />);
    // active item is "Home" — grab the button/link elements
    const activeItems = screen.getAllByRole('button', { name: /Home/i });
    // The active item should have aria-current=page
    const hasAriaCurrent = activeItems.some(
      (el) => el.getAttribute('aria-current') === 'page',
    );
    expect(hasAriaCurrent).toBe(true);
  });

  it('calls onNavSelect when a nav item is clicked', async () => {
    const onNavSelect = vi.fn();
    render(<AppLayoutIsland navItems={navItems} onNavSelect={onNavSelect} />);
    // "Settings" shows up in both desktop and mobile nav; click first occurrence
    const settingsButtons = screen.getAllByText('Settings');
    fireEvent.click(settingsButtons[0]!);
    expect(onNavSelect).toHaveBeenCalledWith('settings');
  });
});

describe('AppLayoutIsland — split panel', () => {
  it('split panel is hidden by default', () => {
    render(
      <AppLayoutIsland
        navItems={navItems}
        splitPanelContent={<div>Split Content</div>}
      />,
    );
    expect(screen.queryByText('Split Content')).not.toBeInTheDocument();
  });

  it('split panel is visible when defaultSplitOpen={true}', () => {
    render(
      <AppLayoutIsland
        navItems={navItems}
        splitPanelContent={<div>Split Content</div>}
        defaultSplitOpen={true}
      />,
    );
    expect(screen.getByText('Split Content')).toBeInTheDocument();
  });

  it('toggle button opens/closes the split panel', async () => {
    const user = userEvent.setup();
    render(
      <AppLayoutIsland
        navItems={navItems}
        splitPanelContent={<div>Split Content</div>}
      />,
    );
    // Initially hidden
    expect(screen.queryByText('Split Content')).not.toBeInTheDocument();

    // Open via toggle button
    const openBtn = screen.getByRole('button', { name: /open details panel/i });
    await user.click(openBtn);
    expect(screen.getByText('Split Content')).toBeInTheDocument();

    // Close again
    const closeBtn = screen.getByRole('button', { name: /close details panel/i });
    await user.click(closeBtn);
    expect(screen.queryByText('Split Content')).not.toBeInTheDocument();
  });
});

describe('AppLayoutIsland — mobile nav drawer', () => {
  it('mobile drawer is not shown initially', () => {
    render(<AppLayoutIsland navItems={navItems} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('clicking hamburger button opens the mobile drawer', async () => {
    const user = userEvent.setup();
    render(<AppLayoutIsland navItems={navItems} />);
    const hamburger = screen.getByRole('button', { name: /open navigation/i });
    await user.click(hamburger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('clicking the backdrop closes the mobile drawer', async () => {
    const user = userEvent.setup();
    render(<AppLayoutIsland navItems={navItems} />);

    // Open drawer
    const hamburger = screen.getByRole('button', { name: /open navigation/i });
    await user.click(hamburger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click backdrop (aria-hidden div behind the drawer)
    // The backdrop is a sibling div. We need to find it by its position in the DOM.
    // It's rendered as a fixed overlay div with aria-hidden="true"
    const backdrop = document.querySelector('[aria-hidden="true"].fixed.inset-0');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('pressing Escape closes the mobile drawer', async () => {
    const user = userEvent.setup();
    render(<AppLayoutIsland navItems={navItems} />);

    const hamburger = screen.getByRole('button', { name: /open navigation/i });
    await user.click(hamburger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('onNavSelect is called when a nav item is clicked in the drawer', async () => {
    const user = userEvent.setup();
    const onNavSelect = vi.fn();
    render(<AppLayoutIsland navItems={navItems} onNavSelect={onNavSelect} />);

    const hamburger = screen.getByRole('button', { name: /open navigation/i });
    await user.click(hamburger);

    // Click "Settings" inside the drawer
    const dialog = screen.getByRole('dialog');
    const settingsBtn = dialog.querySelector('[data-id="settings"]') ??
      Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent?.includes('Settings'));
    expect(settingsBtn).toBeTruthy();
    fireEvent.click(settingsBtn!);
    expect(onNavSelect).toHaveBeenCalledWith('settings');
  });
});
