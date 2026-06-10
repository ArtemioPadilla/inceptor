import * as React from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import ErrorBoundary from './ErrorBoundary';

// A realistic settings surface composing Tabs + every form control. Tabs share
// selected-tab state across List/Content, so the whole thing must hydrate as a
// single island (CLAUDE.md compound-component gotcha).
export default function SettingsDemo() {
  return (
    <ErrorBoundary name="SettingsDemo">
      <SettingsInner />
    </ErrorBoundary>
  );
}

const TIMEZONES = {
  'America/Los_Angeles': 'Pacific (US)',
  'America/New_York': 'Eastern (US)',
  'Europe/London': 'London',
  'Europe/Madrid': 'Madrid',
  'Asia/Tokyo': 'Tokyo',
} as const;

function SettingsInner() {
  // Profile
  const [name, setName] = React.useState('Ada Lovelace');
  const [email, setEmail] = React.useState('ada@example.com');
  const [bio, setBio] = React.useState(
    'Building thoughtful software, one analytical engine at a time.',
  );
  const [timezone, setTimezone] = React.useState<string | null>('Europe/London');

  // Notifications
  const [emailNotifs, setEmailNotifs] = React.useState(true);
  const [pushNotifs, setPushNotifs] = React.useState(false);
  const [weeklyDigest, setWeeklyDigest] = React.useState(true);
  const [marketing, setMarketing] = React.useState(false);

  // Appearance
  const [theme, setTheme] = React.useState('system');
  const [density, setDensity] = React.useState(50);
  const [reduceMotion, setReduceMotion] = React.useState(false);

  const [saved, setSaved] = React.useState(false);
  // Track the timeout id so we can clear it on re-click or unmount,
  // preventing a setState call on an already-unmounted component.
  // Use `number` explicitly: window.setTimeout returns a browser numeric timer id.
  // ReturnType<typeof window.setTimeout> would resolve to NodeJS.Timeout in
  // environments where @types/node is installed (it overrides the global).
  const saveTimerRef = React.useRef<number | null>(null);

  // Clear the pending timer on unmount.
  React.useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  function handleSave() {
    // Local-only demo: no network. Flash a confirmation.
    // Clear any in-flight timer before starting a new one (re-click guard).
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    setSaved(true);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      setSaved(false);
    }, 2000);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* ---------------- Profile ---------------- */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Profile</CardTitle>
              <CardDescription>
                Update your public profile and account details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src="https://avatars.githubusercontent.com/u/9919?v=4"
                    alt={name}
                  />
                  <AvatarFallback>
                    {name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{name}</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                  <Button variant="outline" size="sm" type="button">
                    Change avatar
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="settings-name">Display name</Label>
                  <Input
                    id="settings-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-email">Email</Label>
                  <Input
                    id="settings-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-bio">Bio</Label>
                <Textarea
                  id="settings-bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short description about you…"
                />
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  items={TIMEZONES}
                  value={timezone}
                  onValueChange={(v) => setTimezone(v as string)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIMEZONES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Notifications ---------------- */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Notifications</CardTitle>
              <CardDescription>
                Choose how and when we reach out to you.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              <SwitchRow
                title="Email notifications"
                description="Get notified about activity on your account."
                checked={emailNotifs}
                onCheckedChange={setEmailNotifs}
              />
              <SwitchRow
                title="Push notifications"
                description="Receive push alerts on your devices."
                checked={pushNotifs}
                onCheckedChange={setPushNotifs}
              />
              <SwitchRow
                title="Weekly digest"
                description="A Monday summary of the past week."
                checked={weeklyDigest}
                onCheckedChange={setWeeklyDigest}
              />
              <SwitchRow
                title="Product & marketing"
                description="Occasional news about features and offers."
                checked={marketing}
                onCheckedChange={setMarketing}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Appearance ---------------- */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Appearance</CardTitle>
              <CardDescription>
                Customize how the interface looks and feels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Theme</Label>
                <RadioGroup
                  value={theme}
                  onValueChange={(v) => setTheme(v as string)}
                >
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <RadioGroupItem value="light" /> Light
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <RadioGroupItem value="dark" /> Dark
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <RadioGroupItem value="system" /> System
                  </label>
                </RadioGroup>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Interface density</Label>
                  <span className="font-mono text-xs text-muted-foreground">
                    {density < 34 ? 'Compact' : density < 67 ? 'Comfortable' : 'Spacious'}
                  </span>
                </div>
                <Slider
                  value={density}
                  onValueChange={(v) =>
                    setDensity(Array.isArray(v) ? (v[0] ?? 0) : v)
                  }
                />
              </div>

              <Separator />

              <label className="flex items-center justify-between gap-4">
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium text-foreground">
                    Reduce motion
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    Minimize non-essential animations.
                  </span>
                </span>
                <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
              </label>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm text-muted-foreground" role="status">
            Settings saved.
          </span>
        )}
        <Button type="button" onClick={handleSave}>
          Save changes
        </Button>
      </div>
    </div>
  );
}

function SwitchRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <span className="space-y-0.5">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="block text-sm text-muted-foreground">{description}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}
