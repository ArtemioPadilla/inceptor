import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility gate (Epic 12, criterion #1 of the 7-item UX quality bar).
 *
 * Runs axe-core on the public routes and asserts ZERO serious or critical
 * violations. Moderate/minor issues are reported but not failed (axe's own
 * design recognizes those as advisory).
 *
 * Threshold rationale: serious = "may exclude a large group of users";
 * critical = "blocks access entirely". Neither is acceptable for a scaffold
 * meant to teach principled UX (see docs/ETHICS.md item #7).
 */

const routes = ['/', '/gallery/', '/demos/dashboard/', '/docs/'];

for (const route of routes) {
  test(`a11y — ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    // Disable animations + transitions before scanning so axe doesn't
    // see transient mid-animation states.
    await page.addStyleTag({
      content: `*, *::before, *::after { animation: none !important; transition: none !important; }`,
    });

    const results = await new AxeBuilder({ page })
      // WCAG 2.1 AA is the baseline (PRINCIPLES.md §5)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Critical / serious are gates. Anything lower is reported only.
    const serious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    if (serious.length > 0) {
      console.error(
        `axe violations on ${route}:`,
        JSON.stringify(
          serious.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.length,
          })),
          null,
          2,
        ),
      );
    }
    expect(serious, `${route} should have no critical or serious a11y issues`).toEqual([]);
  });
}
