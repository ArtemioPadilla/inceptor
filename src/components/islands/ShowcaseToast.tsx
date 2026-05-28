import { Button } from '@/components/ui/button';
import { Toaster, toast } from '@/components/ui/toast';
import ErrorBoundary from './ErrorBoundary';

// Wraps Toaster + toast trigger in one island. The Toaster provides the
// Base UI Toast.Provider, so the imperative `toast()` call must originate
// from within the same React tree (same Provider instance).
export default function ShowcaseToast() {
  function fireDefault() {
    toast({
      title: 'Toast fired!',
      description: 'This is a default toast notification.',
    });
  }

  function fireDestructive() {
    toast({
      title: 'Something went wrong',
      description: 'A destructive-style toast for errors.',
      data: { variant: 'destructive' },
    });
  }

  return (
    <ErrorBoundary name="ShowcaseToast">
    <div className="flex flex-wrap gap-2">
      <Toaster />
      <Button variant="outline" onClick={fireDefault}>
        Fire toast
      </Button>
      <Button variant="destructive" onClick={fireDestructive}>
        Fire error toast
      </Button>
    </div>
    </ErrorBoundary>
  );
}
