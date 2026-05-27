import * as React from 'react';
import { Toast as BaseToast } from '@base-ui-components/react/toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// Toast built on Base UI's Toast primitive instead of the Radix UI toast package.
// createToastManager enables imperative usage outside React components.

export const toastManager = BaseToast.createToastManager();

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive: 'border-destructive bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type ToastVariant = VariantProps<typeof toastVariants>['variant'];

export interface ToastData {
  variant?: ToastVariant;
}

// Inner component that calls useToastManager (must be inside Provider)
function ToastList() {
  const { toasts } = BaseToast.useToastManager();

  return (
    <>
      {toasts.map((toast) => {
        const typedToast = toast as BaseToast.Root.ToastObject<ToastData>;
        return (
          <BaseToast.Positioner key={toast.id} toast={toast}>
            <BaseToast.Root
              toast={toast}
              className={cn(
                toastVariants({ variant: typedToast.variant }),
                'data-[ending-style]:opacity-0 data-[ending-style]:translate-x-full',
                'data-[starting-style]:opacity-0 data-[starting-style]:translate-x-full',
                'transition-[opacity,transform]',
              )}
            >
              <div className="grid gap-1">
                {toast.title && (
                  <BaseToast.Title className="text-sm font-semibold">
                    {toast.title}
                  </BaseToast.Title>
                )}
                {toast.description && (
                  <BaseToast.Description className="text-sm opacity-90">
                    {toast.description}
                  </BaseToast.Description>
                )}
              </div>
              <BaseToast.Close className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100">
                <XIcon className="h-4 w-4" />
              </BaseToast.Close>
            </BaseToast.Root>
          </BaseToast.Positioner>
        );
      })}
    </>
  );
}

interface ToasterProps {
  className?: string;
}

// Toaster mounts the Provider+Viewport pair. Place once in your layout.
export function Toaster({ className }: ToasterProps) {
  return (
    <BaseToast.Provider toastManager={toastManager}>
      <BaseToast.Viewport
        className={cn(
          'fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]',
          className,
        )}
      >
        <ToastList />
      </BaseToast.Viewport>
    </BaseToast.Provider>
  );
}

// Convenience function to add a toast imperatively from anywhere in the app.
export function toast(options: Parameters<typeof toastManager.add>[0]) {
  return toastManager.add(options);
}

// Named re-exports for shadcn API parity
export const ToastProvider = BaseToast.Provider;
export const ToastViewport = BaseToast.Viewport;
export const ToastRoot = BaseToast.Root;
export const ToastTitle = BaseToast.Title;
export const ToastDescription = BaseToast.Description;
export const ToastClose = BaseToast.Close;
export const ToastAction = BaseToast.Action;
