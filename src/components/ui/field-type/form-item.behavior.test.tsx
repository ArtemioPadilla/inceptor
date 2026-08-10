// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Form } from '@/components/ui/form';
import { FieldFormItem } from './form-item';
import { fieldTypeZodSchema, type FieldType } from '@/lib/field-type';

// Behavior contracts for the edit/form renderer (ROADMAP Epic 24, contract
// item (c)) — one field definition drives the react-hook-form-wired input.
// Each fieldType gets its own widget behind the same FieldFormItem API; we
// cover the two most structurally different cases (a toggle vs. a
// closed-choice dropdown) rather than every fieldType exhaustively.

const activeFieldType: FieldType = { type: 'boolean', label: 'Active' };
const categoryFieldType: FieldType = {
  type: 'select',
  label: 'Category',
  options: [
    { label: 'Books', value: 'books' },
    { label: 'Music', value: 'music' },
  ],
};

const schema = z.object({
  active: fieldTypeZodSchema(activeFieldType),
  category: fieldTypeZodSchema(categoryFieldType),
});
type Values = z.infer<typeof schema>;

function Harness() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { active: false, category: 'books' },
  });
  return (
    <Form {...form}>
      <form>
        <FieldFormItem control={form.control} name="active" fieldType={activeFieldType} />
        <FieldFormItem control={form.control} name="category" fieldType={categoryFieldType} />
      </form>
    </Form>
  );
}

describe('<FieldFormItem>', () => {
  it('renders a labeled checkbox for a boolean fieldType and toggles it through Controller', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(1);
    expect(checkboxes[0]).not.toBeChecked();

    await user.click(checkboxes[0]!);
    expect(checkboxes[0]).toBeChecked();
  });

  it('renders a <select> populated from a select fieldType.options, defaulted from the form value', () => {
    render(<Harness />);

    // There's only one native <select> in this harness (the category field).
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(1);
    expect((selects[0] as HTMLSelectElement).value).toBe('books');
    expect(screen.getByRole('option', { name: 'Books' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Music' })).toBeInTheDocument();
  });
});
