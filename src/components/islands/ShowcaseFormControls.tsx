import * as React from 'react';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ErrorBoundary from './ErrorBoundary';

// Groups every form control (Select, Checkbox, Radio, Switch, Slider, Textarea)
// in one island so the whole composition hydrates as a unit on /gallery.
export default function ShowcaseFormControls() {
  return (
    <ErrorBoundary name="ShowcaseFormControls">
      <FormControlsInner />
    </ErrorBoundary>
  );
}

function FormControlsInner() {
  const [plan, setPlan] = React.useState<string | null>('pro');
  const [notify, setNotify] = React.useState(true);
  const [terms, setTerms] = React.useState(false);
  const [tier, setTier] = React.useState('monthly');
  const [volume, setVolume] = React.useState(60);

  return (
    <div className="grid max-w-md gap-6">
      {/* Select */}
      <div className="space-y-2">
        <Label>Plan</Label>
        <Select
          items={{ free: 'Free', pro: 'Pro', team: 'Team', enterprise: 'Enterprise' }}
          value={plan}
          onValueChange={(v) => setPlan(v as string)}
        >
          <SelectTrigger aria-label="Plan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="team">Team</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Radio group */}
      <div className="space-y-2">
        <Label>Billing</Label>
        <RadioGroup value={tier} onValueChange={(v) => setTier(v as string)}>
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="monthly" aria-label="Monthly" /> Monthly
          </label>
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="yearly" aria-label="Yearly, two months free" /> Yearly (2 months free)
          </label>
        </RadioGroup>
      </div>

      {/* Switch */}
      <label className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium">Email notifications</span>
        <Switch checked={notify} onCheckedChange={setNotify} aria-label="Email notifications" />
      </label>

      {/* Checkbox */}
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={terms} onCheckedChange={(v) => setTerms(v === true)} aria-label="I accept the terms and conditions" />
        I accept the terms and conditions
      </label>

      {/* Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Volume</Label>
          <span className="font-mono text-xs text-muted-foreground">{volume}</span>
        </div>
        <Slider aria-label="Volume" value={volume} onValueChange={(v) => setVolume(Array.isArray(v) ? v[0] : v)} />
      </div>

      {/* Textarea */}
      <div className="space-y-2">
        <Label htmlFor="fc-message">Message</Label>
        <Textarea id="fc-message" rows={3} placeholder="Tell us what you think…" />
      </div>
    </div>
  );
}
