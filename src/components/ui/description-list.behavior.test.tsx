// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { DescriptionList, DescriptionItem } from './description-list';
import type { FieldType } from '@/lib/field-type';

const dateFieldType: FieldType = { type: 'date', label: 'Created' };

describe('<DescriptionItem> fieldType-driven value rendering (ROADMAP Epic 24)', () => {
  it('renders the formatted fieldType value instead of children when fieldType+value are supplied', () => {
    render(
      <DescriptionList>
        <DescriptionItem term="Created" fieldType={dateFieldType} value={new Date(2026, 0, 15)} />
      </DescriptionList>,
    );
    expect(screen.getByText('January 15, 2026')).toBeInTheDocument();
  });

  it('still renders plain children when fieldType is not supplied (backward compatible)', () => {
    render(
      <DescriptionList>
        <DescriptionItem term="Plan">Pro</DescriptionItem>
      </DescriptionList>,
    );
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });
});
