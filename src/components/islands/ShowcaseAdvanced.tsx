import * as React from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon, AlignLeftIcon, AlignCenterIcon } from 'lucide-react';

import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { NumberField } from '@/components/ui/number-field';
import { Toolbar, ToolbarButton, ToolbarSeparator } from '@/components/ui/toolbar';
import {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Rating } from '@/components/ui/rating';
import { TagInput } from '@/components/ui/tag-input';
import { InputOTP } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Label } from '@/components/ui/label';
import ErrorBoundary from './ErrorBoundary';

export default function ShowcaseAdvanced() {
  return (
    <ErrorBoundary name="ShowcaseAdvanced">
      <AdvancedInner />
    </ErrorBoundary>
  );
}

function AdvancedInner() {
  const [pinned, setPinned] = React.useState(false);
  const [rating, setRating] = React.useState(4);
  const [tags, setTags] = React.useState<string[]>(['astro', 'react']);
  const [otp, setOtp] = React.useState('');

  return (
    <div className="grid max-w-xl gap-8">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Toggle</p>
        <Toggle variant="outline" pressed={pinned} onPressedChange={setPinned}>
          <BoldIcon /> {pinned ? 'Pinned' : 'Pin'}
        </Toggle>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Toggle group</p>
        <ToggleGroup defaultValue={['bold']} multiple>
          <ToggleGroupItem value="bold" aria-label="Bold"><BoldIcon /></ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic"><ItalicIcon /></ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline"><UnderlineIcon /></ToggleGroupItem>
        </ToggleGroup>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Toolbar</p>
        <Toolbar>
          <ToolbarButton><AlignLeftIcon /> Left</ToolbarButton>
          <ToolbarButton><AlignCenterIcon /> Center</ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton aria-label="Bold"><BoldIcon /></ToolbarButton>
          <ToolbarButton aria-label="Italic"><ItalicIcon /></ToolbarButton>
        </Toolbar>
      </section>

      <section className="space-y-2">
        <Label>Number field</Label>
        <NumberField aria-label="Number field" defaultValue={3} min={0} max={99} />
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rating</p>
        <Rating value={rating} onValueChange={setRating} />
      </section>

      <section className="space-y-2">
        <Label>Tags</Label>
        <TagInput value={tags} onValueChange={setTags} placeholder="Add a tag…" />
      </section>

      <section className="space-y-2">
        <Label>Verification code</Label>
        <InputOTP value={otp} onValueChange={setOtp} length={6} />
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sheet (drawer)</p>
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>Open panel</SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Settings</SheetTitle>
              <SheetDescription>A side-anchored dialog — great for mobile nav.</SheetDescription>
            </SheetHeader>
            <SheetClose render={<Button variant="ghost" className="mt-auto" />}>Close</SheetClose>
          </SheetContent>
        </Sheet>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">File upload</p>
        <FileUploadDemo />
      </section>
    </div>
  );
}

function FileUploadDemo() {
  const [files, setFiles] = React.useState<File[]>([]);
  return <FileUpload files={files} onChange={setFiles} multiple maxSize={5 * 1024 * 1024} />;
}
