import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import ErrorBoundary from './ErrorBoundary';

// Groups every overlay (Tooltip, Popover, Alert dialog, Hover card, Context
// menu) in one island so the whole composition hydrates as a unit.
export default function ShowcaseOverlays() {
  return (
    <ErrorBoundary name="ShowcaseOverlays">
      <TooltipProvider>
        <div className="flex flex-wrap items-start gap-3">
          {/* Tooltip */}
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline" />}>Hover for tooltip</TooltipTrigger>
            <TooltipContent>Saved automatically</TooltipContent>
          </Tooltip>

          {/* Popover */}
          <Popover>
            <PopoverTrigger render={<Button variant="outline" />}>Open popover</PopoverTrigger>
            <PopoverContent>
              <PopoverTitle>Filters</PopoverTitle>
              <PopoverDescription>
                Rich anchored content — forms, menus, mini-tools live here.
              </PopoverDescription>
            </PopoverContent>
          </Popover>

          {/* Alert dialog */}
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}>Delete…</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action can't be undone. The item will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
                <AlertDialogClose render={<Button variant="destructive" />}>Delete</AlertDialogClose>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Hover card */}
          <HoverCard>
            <HoverCardTrigger render={<Button variant="link" />}>@inceptor</HoverCardTrigger>
            <HoverCardContent>
              <p className="text-sm font-semibold text-foreground">Inceptor</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Issue-driven web scaffold. Astro + React + Base UI.
              </p>
            </HoverCardContent>
          </HoverCard>

          {/* Context menu */}
          <ContextMenu>
            <ContextMenuTrigger
              render={
                <div className="grid h-10 place-items-center rounded-md border border-dashed border-border px-4 text-sm text-muted-foreground" />
              }
            >
              Right-click me
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuLabel>Actions</ContextMenuLabel>
              <ContextMenuItem>Edit</ContextMenuItem>
              <ContextMenuItem>Duplicate</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem className="text-destructive data-[highlighted]:text-destructive">
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
}
