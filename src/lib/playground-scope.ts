import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Fixed scope for `<Playground>` (ROADMAP Epic 16's "<Playground> live prop
 * editing"). There is no bundler inside the editor, so there's no real
 * `@/components/ui/*` module resolution — instead every identifier a
 * snippet is allowed to reference is pre-bound here and passed into the
 * transpiled function as a free variable (the `{ React, @/components/ui/* }`
 * scope the ROADMAP entry describes).
 *
 * Deliberately small: only the handful of simple, self-contained primitives
 * the first rollout is scoped to (Button, Badge, Alert — see
 * `src/content/gallery-playgrounds.ts` for which gallery pages wire them
 * in). Add to this map — not to `Playground.tsx` itself — when a new
 * gallery page needs another component in scope; pass extra entries via
 * `<Playground scope={{ ... }} />` for anything not worth adding globally.
 */
export const defaultPlaygroundScope: Record<string, unknown> = {
  Button,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
  Skeleton,
};
