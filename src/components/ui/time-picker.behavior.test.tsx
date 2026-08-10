// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimePicker } from './time-picker';

describe('TimePicker (behavior)', () => {
  it('renders a native time input with the controlled value', () => {
    render(<TimePicker value="09:30" onValueChange={() => {}} aria-label="Time" />);
    const input = screen.getByLabelText('Time') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'time');
    expect(input.value).toBe('09:30');
  });

  it('calls onValueChange with the new HH:MM string when changed', () => {
    const onValueChange = vi.fn();
    render(<TimePicker value="09:30" onValueChange={onValueChange} aria-label="Time" />);
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '14:45' } });
    expect(onValueChange).toHaveBeenCalledWith('14:45');
  });

  it('supports uncontrolled usage via defaultValue', () => {
    render(<TimePicker defaultValue="08:00" aria-label="Time" />);
    const input = screen.getByLabelText('Time') as HTMLInputElement;
    expect(input.value).toBe('08:00');
  });
});
