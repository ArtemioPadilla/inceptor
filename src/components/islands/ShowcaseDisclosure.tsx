import * as React from 'react';

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import ErrorBoundary from './ErrorBoundary';

export default function ShowcaseDisclosure() {
  return (
    <ErrorBoundary name="ShowcaseDisclosure">
      <div className="grid max-w-xl gap-8">
        {/* Accordion */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Accordion</p>
          <Accordion defaultValue={['a']} className="rounded-lg border border-border px-4">
            <AccordionItem value="a">
              <AccordionTrigger>What is Inceptor?</AccordionTrigger>
              <AccordionContent>An issue-driven web scaffold on Astro + React + Base UI.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>Is it free?</AccordionTrigger>
              <AccordionContent>Yes — zero-cost, static-first, deploys to GitHub Pages.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Collapsible */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Collapsible</p>
          <Collapsible className="rounded-lg border border-border p-3">
            <CollapsibleTrigger render={<Button variant="ghost" className="w-full justify-between" />}>
              Advanced settings
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="px-1 pt-3 text-sm text-muted-foreground">
                Hidden details revealed on demand.
              </p>
            </CollapsibleContent>
          </Collapsible>
        </section>

        {/* Avatar */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avatar</p>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="https://github.com/ArtemioPadilla.png" alt="Artemio" />
              <AvatarFallback>AP</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>IN</AvatarFallback>
            </Avatar>
          </div>
        </section>

        {/* Skeleton */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skeleton</p>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </section>

        {/* Separator */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Separator</p>
          <div className="flex items-center gap-3 text-sm">
            <span>Docs</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Gallery</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Demos</span>
          </div>
        </section>

        {/* Scroll area */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scroll area</p>
          <ScrollArea className="h-28 rounded-lg border border-border p-3">
            <div className="space-y-1 text-sm text-muted-foreground">
              {Array.from({ length: 14 }, (_, i) => (
                <p key={i}>Row {i + 1} — custom overlay scrollbar.</p>
              ))}
            </div>
          </ScrollArea>
        </section>

        {/* Aspect ratio */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aspect ratio (16:9)</p>
          <AspectRatio ratio={16 / 9} className="rounded-lg border border-border">
            <div className="grid h-full w-full place-items-center bg-primary/10 text-sm text-primary">
              16 : 9
            </div>
          </AspectRatio>
        </section>
      </div>
    </ErrorBoundary>
  );
}
