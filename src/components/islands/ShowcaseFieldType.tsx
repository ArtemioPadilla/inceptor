import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { type ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DescriptionItem, DescriptionList } from '@/components/ui/description-list';
import { FieldFormItem } from '@/components/ui/field-type/form-item';
import { Form } from '@/components/ui/form';
import {
  PropertyFilter,
  filterByTokens,
  type FilterProperty,
  type FilterToken,
} from '@/components/ui/property-filter';
import { fieldTypeZodSchema, type FieldType } from '@/lib/field-type';
import ErrorBoundary from './ErrorBoundary';

/**
 * ShowcaseFieldType — the ROADMAP Epic 24 worked example: "one field
 * definition drives four surfaces."
 *
 * Compare `fieldDefs` below to ShowcaseDataTable.tsx's STATUS_STYLES map —
 * that showcase hand-wires status coloring once for its DataTable column and
 * has no Form/description-list/PropertyFilter equivalent at all. Here,
 * `fieldDefs.status` is defined ONCE and reused, unmodified, by:
 *   1. a DataTable column (`meta: { fieldType }` — no `cell` needed)
 *   2. a Form field (`<FieldFormItem fieldType={...} />`)
 *   3. a description-list row (`<DescriptionItem fieldType={...} value={...} />`)
 *   4. a PropertyFilter property (`{ ..., fieldType }` — swaps in the right widget)
 */
interface Order {
  id: string;
  customer: string;
  amount: number;
  status: 'paid' | 'pending' | 'refunded';
  category: 'hardware' | 'software' | 'services';
  createdAt: string;
}

const fieldDefs = {
  amount: { type: 'money', label: 'Amount', currency: 'USD' },
  status: {
    type: 'status',
    label: 'Status',
    statuses: [
      { value: 'paid', label: 'Paid', tone: 'success' },
      { value: 'pending', label: 'Pending', tone: 'warning' },
      { value: 'refunded', label: 'Refunded', tone: 'danger' },
    ],
  },
  category: {
    type: 'select',
    label: 'Category',
    options: [
      { label: 'Hardware', value: 'hardware' },
      { label: 'Software', value: 'software' },
      { label: 'Services', value: 'services' },
    ],
  },
  createdAt: { type: 'date', label: 'Created' },
} satisfies Record<string, FieldType>;

const ORDERS: Order[] = [
  { id: 'ORD-1', customer: 'Acme Robotics', amount: 4820, status: 'paid', category: 'hardware', createdAt: '2026-01-14' },
  { id: 'ORD-2', customer: 'Blue Harbor', amount: 1290, status: 'pending', category: 'software', createdAt: '2026-02-03' },
  { id: 'ORD-3', customer: 'Cedar & Co', amount: 760, status: 'refunded', category: 'services', createdAt: '2025-12-22' },
  { id: 'ORD-4', customer: 'Delta Freight', amount: 3120, status: 'paid', category: 'services', createdAt: '2026-01-29' },
  { id: 'ORD-5', customer: 'Echo Studio', amount: 990, status: 'pending', category: 'software', createdAt: '2026-02-11' },
];

// Surface 1: DataTable columns. `amount`/`status`/`category` supply
// `meta.fieldType` and no `cell` — the shared display renderer formats
// them. `createdAt` is left as a plain accessor column (no fieldType) to
// show the raw-string API still works unchanged alongside it.
const columns: ColumnDef<Order, unknown>[] = [
  { accessorKey: 'id', header: 'ID', size: 80 },
  { accessorKey: 'customer', header: 'Customer', size: 160 },
  { accessorKey: 'amount', header: 'Amount', size: 100, meta: { fieldType: fieldDefs.amount } },
  { accessorKey: 'status', header: 'Status', size: 110, meta: { fieldType: fieldDefs.status } },
  { accessorKey: 'category', header: 'Category', size: 120, meta: { fieldType: fieldDefs.category } },
  { accessorKey: 'createdAt', header: 'Created', size: 120, meta: { fieldType: fieldDefs.createdAt } },
];

// Surface 4: PropertyFilter properties. `amount`/`status`/`category` reuse
// the exact same fieldDefs entries the DataTable columns above use —
// PropertyFilter derives the right value widget (number input / <select> /
// <select>) and default operators from each. `createdAt` is intentionally
// left out here: filterByTokens' numeric operators coerce via `Number(...)`,
// which isn't date-aware, so a date fieldType's '>'/'<' operators wouldn't
// filter correctly against it without a date-aware predicate — out of
// scope for this pass (filterByTokens itself predates Epic 24).
const FILTER_PROPERTIES: FilterProperty[] = [
  { key: 'customer', label: 'Customer' },
  { key: 'amount', label: 'Amount', fieldType: fieldDefs.amount },
  { key: 'status', label: 'Status', fieldType: fieldDefs.status },
  { key: 'category', label: 'Category', fieldType: fieldDefs.category },
];

// Surface 2 (Form): one Zod schema, each field derived from the same
// fieldDefs entries via fieldTypeZodSchema (Spec-DD, docs/PRINCIPLES.md §3).
const editSchema = z.object({
  amount: fieldTypeZodSchema(fieldDefs.amount),
  status: fieldTypeZodSchema(fieldDefs.status),
  category: fieldTypeZodSchema(fieldDefs.category),
  createdAt: fieldTypeZodSchema(fieldDefs.createdAt),
});
type EditValues = z.infer<typeof editSchema>;

export default function ShowcaseFieldType() {
  const [tokens, setTokens] = React.useState<FilterToken[]>([]);
  const filtered = React.useMemo(() => filterByTokens(ORDERS, tokens), [tokens]);

  const [selectedId, setSelectedId] = React.useState(ORDERS[0]!.id);
  const selected = ORDERS.find((o) => o.id === selectedId) ?? ORDERS[0]!;

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    // react-hook-form's `values` (distinct from `defaultValues`) keeps the
    // form in sync whenever `selected` changes — picking a different order
    // below re-populates every field from that order's own field values.
    values: {
      amount: selected.amount,
      status: selected.status,
      category: selected.category,
      createdAt: new Date(selected.createdAt),
    },
  });

  function onSubmit(values: EditValues) {
    // Showcase only — logs the edited values, doesn't mutate ORDERS.
    console.log('[ShowcaseFieldType] form submit:', values);
  }

  return (
    <ErrorBoundary name="ShowcaseFieldType">
      <div className="space-y-6 pb-16">
        <p className="text-sm text-muted-foreground">
          One <code className="rounded bg-muted px-1 py-0.5 text-xs">fieldDefs</code> object
          (ROADMAP Epic 24) drives every surface below — a DataTable column, a
          Form field, a description-list row, and a PropertyFilter property —
          for <code className="rounded bg-muted px-1 py-0.5 text-xs">amount</code>,{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">status</code>, and{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">category</code>.
        </p>

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            PropertyFilter (surface 4) → DataTable (surface 1)
          </h3>
          <PropertyFilter properties={FILTER_PROPERTIES} tokens={tokens} onChange={setTokens} />
          <DataTable columns={columns} data={filtered} height="260px" estimateRowSize={44} />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              description-list (surface 3)
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {ORDERS.map((o) => (
                <Button
                  key={o.id}
                  type="button"
                  size="sm"
                  variant={o.id === selected.id ? 'default' : 'outline'}
                  onClick={() => setSelectedId(o.id)}
                >
                  {o.id}
                </Button>
              ))}
            </div>
            <DescriptionList className="rounded-lg border border-border px-4">
              <DescriptionItem term="Amount" fieldType={fieldDefs.amount} value={selected.amount} />
              <DescriptionItem term="Status" fieldType={fieldDefs.status} value={selected.status} />
              <DescriptionItem term="Category" fieldType={fieldDefs.category} value={selected.category} />
              <DescriptionItem
                term="Created"
                fieldType={fieldDefs.createdAt}
                value={new Date(selected.createdAt)}
              />
            </DescriptionList>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Form (surface 2) — edit the selected order
            </h3>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 rounded-lg border border-border p-4"
              >
                <FieldFormItem control={form.control} name="amount" fieldType={fieldDefs.amount} />
                <FieldFormItem control={form.control} name="status" fieldType={fieldDefs.status} />
                <FieldFormItem control={form.control} name="category" fieldType={fieldDefs.category} />
                <FieldFormItem control={form.control} name="createdAt" fieldType={fieldDefs.createdAt} />
                <Button type="submit" size="sm">
                  Save (console.log only)
                </Button>
              </form>
            </Form>
          </div>
        </section>
      </div>
    </ErrorBoundary>
  );
}
