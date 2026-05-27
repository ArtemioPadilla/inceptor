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

// Wraps the Dialog compound component in a single island to satisfy the
// Astro compound-component constraint: all stateful composition must live
// in one React tree so state doesn't break across island boundaries.
export default function ShowcaseDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
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
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>Confirm</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
