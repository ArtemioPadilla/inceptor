import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ErrorBoundary from './ErrorBoundary';

// Wraps the Dialog compound component in a single island to satisfy the
// Astro compound-component constraint: all stateful composition must live
// in one React tree so state doesn't break across island boundaries.
//
// Base UI uses a `render` prop instead of Radix's `asChild` pattern.
// Passing render={<Button variant="..." />} lets Base UI merge its own
// behavior (aria, open/close handlers) onto the Button element.
export default function ShowcaseDialog() {
  return (
    <ErrorBoundary name="ShowcaseDialog">
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Open dialog
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Example dialog</DialogTitle>
          <DialogDescription>
            This is a dialog built on Base UI primitives with a shadcn-compatible
            API. Click "Confirm" or press Escape to close.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Any content can go here — forms, confirmations, detail views, etc.
        </p>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <DialogClose render={<Button />}>Confirm</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </ErrorBoundary>
  );
}
