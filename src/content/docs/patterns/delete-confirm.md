---
title: Delete with confirmation
description: Destructive actions, gated by friction proportional to the blast radius.
---

Deleting is irreversible; the confirmation friction should scale with the
consequence.

## Build it from

- **`AlertDialog`** (`src/components/ui/`) — the modal confirmation. The
  destructive button uses the `destructive` variant.
- **`Flashbar`** (`src/components/ui/flashbar.tsx`) — the *result*: a
  page-level success ("3 items deleted") or error ("couldn't delete 1 item")
  flash, with an **Undo** action where the delete is soft-reversible.

## Three friction tiers

| Tier | When | Confirmation |
|---|---|---|
| One-click | Trivial, reversible (remove a tag) | none — offer Undo via Flashbar instead |
| Simple confirm | Standard delete | AlertDialog "Delete X?" → Delete |
| Typed confirm | High blast radius (delete a project) | AlertDialog requiring the user to type the resource name |

## Decisions this encodes

- **Match friction to consequence** — a confirm dialog on a reversible action
  is a dark pattern (needless friction); none on an irreversible bulk delete is
  negligence.
- **Always report the outcome** via Flashbar, with Undo when you can offer it.

Live: the AlertDialog in [`/gallery/overlays/`](/gallery/overlays/); Flashbar in
[`/gallery/feedback/`](/gallery/feedback/).
