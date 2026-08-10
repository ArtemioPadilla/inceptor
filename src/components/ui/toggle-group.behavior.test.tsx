// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';

describe('ToggleGroup segmented variant (behavior)', () => {
  it('still toggles items normally when variant="segmented"', async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup variant="segmented" defaultValue={['left']}>
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole('button', { name: 'Left' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Right' })).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: 'Right' }));
    expect(screen.getByRole('button', { name: 'Right' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders an aria-hidden sliding indicator element only for the segmented variant', () => {
    const { container: segmented } = render(
      <ToggleGroup variant="segmented" defaultValue={['a']}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(segmented.querySelector('[aria-hidden="true"]')).toBeInTheDocument();

    const { container: plain } = render(
      <ToggleGroup defaultValue={['a']}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(plain.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
  });
});
