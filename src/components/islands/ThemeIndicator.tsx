import { useStore } from '@nanostores/react';
import { $theme } from '@/stores/theme';

/**
 * Demo island: renders the current theme value reactively.
 * Purpose: prove that an island which has no toggle of its own still updates
 * live when ThemeToggle (a separate island) flips the Nano Store.
 *
 * Hydration: client:visible — only active once scrolled into view.
 * State: reads $theme via useStore; zero React Context involved.
 */
export default function ThemeIndicator() {
  const theme = useStore($theme);
  return (
    <span
      className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
      data-testid="theme-indicator"
    >
      <span aria-hidden="true">{theme === 'dark' ? '🌙' : '☀️'}</span>
      <span>
        Current theme: <strong className="text-foreground">{theme}</strong>
      </span>
    </span>
  );
}
