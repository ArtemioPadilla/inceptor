import * as React from 'react';
import type { DateRange } from 'react-day-picker';

import { Label } from '@/components/ui/label';
import { DatePicker, DateRangePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { ColorPicker } from '@/components/ui/color-picker';
import { Editable } from '@/components/ui/editable';
import { PasswordInput } from '@/components/ui/password-input';
import { ClipboardButton } from '@/components/ui/clipboard';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import ErrorBoundary from './ErrorBoundary';

// Universal input & utility primitives (ROADMAP Epic 21) — Date/Date-range
// picker, Time picker, Color picker, Editable, Password input, Clipboard,
// and the Toggle Group segmented-indicator polish, all in one island so the
// whole composition hydrates as a unit on /gallery (see docs/COMPONENTS.md §4).
export default function ShowcaseInputPrimitives() {
  return (
    <ErrorBoundary name="ShowcaseInputPrimitives">
      <InputPrimitivesInner />
    </ErrorBoundary>
  );
}

function InputPrimitivesInner() {
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [range, setRange] = React.useState<DateRange | undefined>(undefined);
  const [time, setTime] = React.useState('09:30');
  const [color, setColor] = React.useState('#10b981');
  const [label, setLabel] = React.useState('Production API key');
  const [region, setRegion] = React.useState<string[]>(['us']);

  return (
    <div className="grid max-w-xl gap-8">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Date picker
        </p>
        <DatePicker value={date} onValueChange={setDate} />
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Date range picker
        </p>
        <DateRangePicker value={range} onValueChange={setRange} />
      </section>

      <section className="space-y-2">
        <Label htmlFor="ip-time">Time picker (combine with a date field for date+time)</Label>
        <TimePicker id="ip-time" value={time} onValueChange={setTime} className="max-w-[160px]" />
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Color picker
        </p>
        <ColorPicker value={color} onValueChange={setColor} />
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Editable (click to rename)
        </p>
        <Editable value={label} onValueChange={setLabel} />
      </section>

      <section className="space-y-2">
        <Label htmlFor="ip-password">Password input</Label>
        <PasswordInput id="ip-password" defaultValue="hunter2" className="max-w-xs" />
      </section>

      <section className="space-y-2">
        <Label htmlFor="ip-clipboard">Clipboard</Label>
        <div className="flex max-w-xs items-center gap-2">
          <Input id="ip-clipboard" readOnly value="sk_live_51H8f...9d2c" className="font-mono text-xs" />
          <ClipboardButton value="sk_live_51H8f9d2c" label="Copy API key" />
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Toggle group — segmented (sliding indicator)
        </p>
        <ToggleGroup variant="segmented" value={region} onValueChange={(v) => setRegion(v as string[])}>
          <ToggleGroupItem value="us">US</ToggleGroupItem>
          <ToggleGroupItem value="eu">EU</ToggleGroupItem>
          <ToggleGroupItem value="apac">APAC</ToggleGroupItem>
        </ToggleGroup>
      </section>
    </div>
  );
}
