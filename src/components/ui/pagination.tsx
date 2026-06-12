import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

// Pagination — dependency-free navigation primitive for paged lists.
function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      aria-label="Pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={cn('flex flex-row items-center gap-1', className)} {...props} />;
}

interface PaginationLinkProps extends React.ComponentProps<'a'> {
  isActive?: boolean;
}

function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
  return (
    <li>
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content -- children come from ...props spread */}
      <a
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          buttonVariants({ variant: isActive ? 'outline' : 'ghost', size: 'icon' }),
          'cursor-pointer',
          className,
        )}
        {...props}
      />
    </li>
  );
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<'a'>) {
  return (
    <li>
      <a
        aria-label="Go to previous page"
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'gap-1 cursor-pointer',
          className,
        )}
        {...props}
      >
        <ChevronLeftIcon className="h-4 w-4" /> Previous
      </a>
    </li>
  );
}

function PaginationNext({ className, ...props }: React.ComponentProps<'a'>) {
  return (
    <li>
      <a
        aria-label="Go to next page"
        className={cn(buttonVariants({ variant: 'ghost' }), 'gap-1 cursor-pointer', className)}
        {...props}
      >
        Next <ChevronRightIcon className="h-4 w-4" />
      </a>
    </li>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      className={cn('flex h-9 w-9 items-center justify-center text-muted-foreground', className)}
      {...props}
    >
      …
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
