// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Playground from './Playground';

// ROADMAP Epic 16 — "<Playground> live prop editing". Scope resolved by the
// 2026-08 DX study: a react-runner-style single-file transpile-on-keystroke
// editor (sucrase, not a full Sandpack bundler), scoped to a fixed
// { React, @/components/ui/* }-equivalent scope. Behavior contracts:
//   1. Renders the compiled output of `initialCode` using the fixed scope.
//   2. Live-updates the preview when the user edits the code (transpile on
//      keystroke, no separate "run" button).
//   3. Shows a readable, non-crashing error message for code that fails to
//      compile or throws at render time — never blanks the whole page.

describe('Playground (behavior)', () => {
  it('renders the compiled output of the initial code using the fixed scope', () => {
    render(<Playground initialCode="<Button>Click me</Button>" />);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('updates the rendered preview when the code is edited', () => {
    render(<Playground initialCode="<Button>Click me</Button>" />);
    const editor = screen.getByLabelText('Playground code editor');
    fireEvent.change(editor, { target: { value: "<Badge>New label</Badge>" } });
    expect(screen.getByText('New label')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Click me' })).not.toBeInTheDocument();
  });

  it('shows a readable error instead of crashing on unresolvable code', () => {
    render(<Playground initialCode="<Button>{undefinedThing.value}</Button>" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('recovers and clears the error once the code is fixed', () => {
    render(<Playground initialCode="<Button>{undefinedThing.value}</Button>" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    const editor = screen.getByLabelText('Playground code editor');
    fireEvent.change(editor, { target: { value: '<Button>Fixed</Button>' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fixed' })).toBeInTheDocument();
  });
});
