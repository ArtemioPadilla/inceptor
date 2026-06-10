---
title: The compound-component gotcha
description: Why Dialog and Tabs must live in one island.
---

This is the most common mistake when adding interactive components to an Astro
project. Read it once and remember it.

## The rule

Components that share state internally — `Dialog`, `DropdownMenu`, `Tabs`, `Toast`,
controlled accordion — **must be wrapped in a single React file and hydrated as one
island.** You cannot spread the parts across multiple islands or multiple `client:*`
usages in the same `.astro` file.

## Why

Astro's partial hydration creates a separate React root for each `client:*`
directive. State stored inside one React root is invisible to another. A `Dialog.Root`
in island A cannot communicate its open state to `Dialog.Content` in island B —
they are different React trees, even on the same page.

## The wrong pattern

```astro
---
// BAD: do not do this
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
---
<!-- These are in separate React roots — state is broken -->
<Dialog client:visible>
  <DialogTrigger client:visible>Open</DialogTrigger>
  <DialogContent client:visible>...</DialogContent>
</Dialog>
```

## The correct pattern

Create one React file that owns the entire composition:

```tsx
// src/components/islands/ShowcaseDialog.tsx
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent,
         DialogHeader, DialogTitle, DialogDescription,
         DialogFooter, DialogClose } from '@/components/ui/dialog';

export default function ShowcaseDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Open dialog
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Example dialog</DialogTitle>
          <DialogDescription>Content goes here.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button />}>Confirm</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

Then hydrate the whole file as one island:

```astro
---
import ShowcaseDialog from '../components/islands/ShowcaseDialog';
---
<ShowcaseDialog client:visible />
```

## What's already following this pattern

`ShowcaseDialog.tsx`, `ShowcaseTabs.tsx`, `ShowcaseDropdown.tsx`,
`ShowcaseToast.tsx`, and `ShowcaseForm.tsx` all live in `src/components/islands/`
and are hydrated as single islands.

## Does not apply to

Stateless presentational components like `Button`, `Card`, `Badge`, `Input` in
isolation — these can appear directly in `.astro` files without hydration if they
need no interactivity.

Full guide → [`docs/COMPONENTS.md §4`](https://github.com/ArtemioPadilla/inceptor/blob/main/docs/COMPONENTS.md#4-the-compound-component-gotcha) · also see [`CLAUDE.md`](https://github.com/ArtemioPadilla/inceptor/blob/main/CLAUDE.md#shadcnui--astro-the-compound-component-gotcha)
