---
title: Create flow pattern
description: Single-page and multi-step resource creation, validated with Zod.
---

How to let a user create a resource. Two shapes; pick by field count and
branching.

## Single-page create

For a handful of fields with no branching. Use **`Form`**
(`src/components/ui/form.tsx`) — react-hook-form + a **Zod** schema as the
single source of truth (Spec-DD: the type is `z.infer`, never hand-authored).
Validate on submit; show field errors inline; disable submit while pending.

## Multi-step create (Wizard)

For many fields or branching steps. Use **`Wizard`**
(`src/components/islands/WizardIsland.tsx`): one step per logical group, each
step validates before "Next" advances, a visible step indicator, and a final
review step before commit.

```tsx
<Wizard
  steps={[
    { title: 'Basics', content: <BasicsFields />, validate: () => basicsSchema.safeParse(values).success },
    { title: 'Details', content: <DetailFields /> },
    { title: 'Review', content: <ReviewSummary /> },
  ]}
  onComplete={submit}
/>
```

## Decisions this encodes

- **Validate per step, not only at the end** — don't let a user reach step 4
  before telling them step 1 is invalid.
- **Zod schema is the contract** — the same schema validates the form and (if
  a backend is wired) the API payload.
- **A review step before any irreversible commit.**

Live: [`/gallery/wizard/`](/gallery/wizard/).
