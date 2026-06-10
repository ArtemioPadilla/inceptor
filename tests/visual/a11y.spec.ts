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

    // Known upstream issues, NOT ours: @base-ui-components/react 1.0.0-rc.0
    // (a) emits aria-orientation on elements whose computed role doesn't
    // allow it (the Slider's hidden <input>, menu <ul>s), and (b) does not
    // propagate aria-label from Root to its internal auto-id'd inputs
    // (Slider, NumberField), so axe's `label` rule flags those hidden
    // inputs even when the visible control is fully labelled. Both are
    // tracked by the Epic 5 re-pin to the stable release — remove this
    // allowlist when @base-ui-components/react leaves rc. Everything else
    // still gates.
    const isUpstreamBaseUi = (v: (typeof results.violations)[number]) =>
      (v.id === 'aria-allowed-attr' &&
        v.nodes.every((n) => n.html.includes('aria-orientation='))) ||
      (v.id === 'label' && v.nodes.every((n) => n.html.includes('id="base-ui-')));

    // Critical / serious are gates. Anything lower is reported only.
    const serious = results.violations.filter(
      (v) =>
        (v.impact === 'critical' || v.impact === 'serious') && !isUpstreamBaseUi(v),
    );
    if (serious.length > 0) {
      console.error(
        `axe violations on ${route}:`,
        JSON.stringify(
          serious.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.map((n) => n.html.slice(0, 160)),
          })),
          null,
          2,
        ),
      );
    }
    expect(serious, `${route} should have no critical or serious a11y issues`).toEqual([]);
  });
}
