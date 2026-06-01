import * as React from 'react';
import { AlertDialog as BaseAlertDialog } from '@base-ui-components/react/alert-dialog';

import { cn } from '@/lib/utils';

// Alert dialog built on Base UI's AlertDialog primitive (NOT Radix). Use for
// destructive-action confirmations — unlike Dialog, it can't be dismissed by
// clicking the backdrop, forcing an explicit choice.
const AlertDialog = BaseAlertDialog.Root;
const AlertDialogTrigger = BaseAlertDialog.Trigger;
const AlertDialogClose = BaseAlertDialog.Close;

const AlertDialogContent = React.forwardRef<
  React.ComponentRef<typeof BaseAlertDialog.Popup>,
  React.ComponentPropsWithoutRef<typeof BaseAlertDialog.Popup>
>(({ className, children, ...props }, ref) => (
  <BaseAlertDialog.Portal>
    <BaseAlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/80 transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
    <BaseAlertDialog.Popup
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 grid w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg',
        'transition-[transform,opacity] data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
        className,
      )}
      {...props}
    >
      {children}
    </BaseAlertDialog.Popup>
  </BaseAlertDialog.Portal>
));
AlertDialogContent.displayName = 'AlertDialogContent';

function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

const AlertDialogTitle = React.forwardRef<
  React.ComponentRef<typeof BaseAlertDialog.Title>,
  React.ComponentPropsWithoutRef<typeof BaseAlertDialog.Title>
>(({ className, ...props }, ref) => (
  <BaseAlertDialog.Title
    ref={ref}
    className={cn('text-lg font-semibold', className)}
    {...props}
  />
));
AlertDialogTitle.displayName = 'AlertDialogTitle';

const AlertDialogDescription = React.forwardRef<
  React.ComponentRef<typeof BaseAlertDialog.Description>,
  React.ComponentPropsWithoutRef<typeof BaseAlertDialog.Description>
>(({ className, ...props }, ref) => (
  <BaseAlertDialog.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
AlertDialogDescription.displayName = 'AlertDialogDescription';

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
};
