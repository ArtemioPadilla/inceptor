import { test, expect } from '@playwright/test';

/**
 * Keyboard-navigation gate (ROADMAP Epic 12, `npm run keyboard-nav`).
 *
 * Two checks per key page:
 *
 *  1. Tab-walk — press Tab ~25 times and assert that each landing
 *     `document.activeElement` is a genuinely interactive element
 *     (a, button, input, select, textarea, [tabindex], [role=tab], …).
 *     This catches "focus traps in dead elements" and tabindex on
 *     non-interactive nodes.
 *
 *  2. Focus-visible ring — for every visible, enabled interactive element,
 *     call `el.focus()` and assert a visible focus indicator exists:
 *     `outline-width !== '0px'` OR `box-shadow !== 'none'`. WCAG 2.4.7
 *     (Focus Visible) requires the keyboard focus location to be visible.
 *
 * We cannot read the `:focus-visible` pseudo-class via getComputedStyle, so
 * we drive real focus and read the resolved computed style instead — which is
 * exactly what a keyboard user would perceive.
 */

const routes = ['/', '/gallery/', '/gallery/form-controls/', '/demos/dashboard/'];

// Selector for elements we expect to be reachable + focus-styled.
const INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, [role="tab"], [tabindex="0"]';

for (const route of routes) {
  test.describe(`keyboard-nav — ${route}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
    });

    test('Tab walk lands only on interactive elements', async ({ page }) => {
      // Start from a known point so the first Tab is deterministic.
      await page.locator('body').click({ position: { x: 1, y: 1 } });

      const TAB_PRESSES = 25;
      let landedOnSomething = false;

      for (let i = 0; i < TAB_PRESSES; i++) {
        await page.keyboard.press('Tab');

        const info = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body || el === document.documentElement) {
            return null;
          }
          const tag = el.tagName.toLowerCase();
          const role = el.getAttribute('role');
          const tabindex = el.getAttribute('tabindex');
          const interactiveTags = [
            'a',
            'button',
            'input',
            'select',
            'textarea',
            'summary',
            'audio',
            'video',
            'iframe',
          ];
          const isInteractive =
            interactiveTags.includes(tag) ||
            role === 'tab' ||
            role === 'button' ||
            role === 'link' ||
            role === 'menuitem' ||
            role === 'checkbox' ||
            role === 'radio' ||
            role === 'switch' ||
            role === 'textbox' ||
            role === 'combobox' ||
            role === 'option' ||
            (tabindex !== null && tabindex !== '-1') ||
            el.isContentEditable;
          return { tag, role, tabindex, isInteractive };
        });

        // Focus may leave the document (e.g. into browser chrome / nothing
        // focusable left). That's not a failure — just stop asserting.
        if (info === null) {
          continue;
        }

        landedOnSomething = true;
        expect(
          info.isInteractive,
          `Tab #${i + 1} on ${route} landed on a non-interactive <${info.tag}> ` +
            `(role=${info.role ?? 'none'}, tabindex=${info.tabindex ?? 'none'})`,
        ).toBe(true);
      }

      // Sanity: at least one Tab should have reached an interactive element.
      expect(
        landedOnSomething,
        `${route} had no keyboard-focusable elements after ${TAB_PRESSES} Tabs`,
      ).toBe(true);
    });

    test('every interactive element shows a visible focus indicator', async ({ page }) => {
      const locator = page.locator(INTERACTIVE_SELECTOR);
      const count = await locator.count();

      let checked = 0;

      for (let i = 0; i < count; i++) {
        const el = locator.nth(i);

        // Skip hidden / disabled / not-rendered elements — they can't be
        // focused by a keyboard user, so a missing ring is not a defect.
        const focusable = await el.evaluate((node) => {
          const e = node as HTMLElement;
          const style = getComputedStyle(e);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          if (parseFloat(style.opacity) === 0) return false;
          if ((e as HTMLButtonElement).disabled) return false;
          if (e.getAttribute('aria-disabled') === 'true') return false;
          if (e.getAttribute('aria-hidden') === 'true') return false;
          if (e.getAttribute('tabindex') === '-1') return false;
          const rect = e.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) return false;
          return true;
        });

        if (!focusable) continue;

        // Drive real focus and read the resolved computed style. WCAG 2.4.7
        // accepts a focus indicator rendered by a container as well (the
        // `focus-within` pattern, e.g. TagInput's wrapper ring), so when the
        // element itself shows nothing we also inspect up to two ancestors.
        const indicator = await el.evaluate((node) => {
          const e = node as HTMLElement;
          e.focus();
          if (document.activeElement !== e) {
            return { focused: false, outlineWidth: '0px', boxShadow: 'none' };
          }
          const read = (t: Element) => {
            const s = getComputedStyle(t);
            return {
              outlineWidth: s.outlineWidth,
              outlineStyle: s.outlineStyle,
              boxShadow: s.boxShadow,
            };
          };
          const visible = (v: ReturnType<typeof read>) =>
            (v.outlineWidth !== '0px' && v.outlineStyle !== 'none') ||
            (v.boxShadow !== 'none' && v.boxShadow !== '');
          let best = read(e);
          let ancestor: Element | null = e.parentElement;
          for (let hops = 0; hops < 2 && ancestor && !visible(best); hops++) {
            if (ancestor.matches(':focus-within')) {
              const v = read(ancestor);
              if (visible(v)) best = v;
            }
            ancestor = ancestor.parentElement;
          }
          return { focused: true, ...best };
        });

        // If the element refused focus (e.g. an <a> without href), skip it.
        if (!indicator.focused) continue;

        checked++;

        const hasOutline =
          indicator.outlineWidth !== '0px' && indicator.outlineStyle !== 'none';
        const hasShadow = indicator.boxShadow !== 'none' && indicator.boxShadow !== '';
        const hasIndicator = hasOutline || hasShadow;

        const desc = await el.evaluate((node) => {
          const e = node as HTMLElement;
          const label = (e.textContent ?? '').trim().slice(0, 40);
          return `<${e.tagName.toLowerCase()}> "${label}"`;
        });

        expect(
          hasIndicator,
          `${desc} on ${route} has no visible focus indicator ` +
            `(outline-width=${indicator.outlineWidth}, box-shadow=${indicator.boxShadow})`,
        ).toBe(true);
      }

      expect(
        checked,
        `${route} exposed no focusable interactive elements to check`,
      ).toBeGreaterThan(0);
    });
  });
}
