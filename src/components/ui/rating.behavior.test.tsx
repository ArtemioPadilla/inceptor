// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Rating } from './rating';

describe('Rating (behavior)', () => {
  it('renders one radio per star (default max 5)', () => {
    render(<Rating value={0} onValueChange={() => {}} />);
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('marks the current value as checked', () => {
    render(<Rating value={2} onValueChange={() => {}} />);
    expect(screen.getByRole('radio', { name: '2 stars' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('calls onValueChange(3) when the 3rd star is clicked', () => {
    const onValueChange = vi.fn();
    render(<Rating value={0} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('radio', { name: '3 stars' }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(3);
  });

  it('does not fire onValueChange when readOnly', () => {
    const onValueChange = vi.fn();
    render(<Rating value={1} readOnly onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('radio', { name: '3 stars' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
