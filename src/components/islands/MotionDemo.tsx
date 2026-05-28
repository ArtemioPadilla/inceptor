import * as React from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'motion/react';
import ErrorBoundary from './ErrorBoundary';

/**
 * Demonstration of the LazyMotion + domAnimation pattern.
 *
 * LazyMotion defers loading the Motion runtime until this island hydrates,
 * and `domAnimation` is a lightweight feature bundle (~15kb gzip) that
 * covers most common cases. Use `m.*` instead of `motion.*` inside
 * <LazyMotion> — `motion.*` loads the full feature set eagerly, defeating
 * the purpose.
 *
 * strict mode on <LazyMotion> throws at dev-time if you accidentally use
 * `motion.*` components inside it, guarding against the eager-load footgun.
 */
export default function MotionDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <ErrorBoundary name="MotionDemo">
    <LazyMotion features={domAnimation} strict>
      <div className="flex flex-col items-start gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {open ? 'Hide' : 'Show'} animated card
        </button>
        <AnimatePresence>
          {open && (
            <m.div
              key="card"
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 360, damping: 24 }}
              className="w-full max-w-md rounded-lg border border-border bg-card p-4 text-card-foreground"
            >
              <h3 className="text-sm font-semibold">Motion island</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                LazyMotion + domAnimation. Motion is lazy-loaded into its own
                chunk; only this island pulls it in.
              </p>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
    </ErrorBoundary>
  );
}
