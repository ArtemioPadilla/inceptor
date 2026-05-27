import { describe, expect, it } from 'vitest';
import source from '../../docs/COMPONENTS.md?raw';
import readme from '../../README.md?raw';

describe('docs/COMPONENTS.md', () => {
  it('exists and is non-trivial', () => {
    expect(source.length).toBeGreaterThan(2000);
  });

  it('covers all 5 required topics', () => {
    expect(source.toLowerCase()).toMatch(/adding a shadcn component|adding a component/);
    expect(source.toLowerCase()).toMatch(/hydration directives?/);
    expect(source.toLowerCase()).toMatch(/compound[\s-]?component/);
    expect(source.toLowerCase()).toMatch(/theming via css|css vars/);
    expect(source.toLowerCase()).toMatch(/dark[\s-]?mode/);
  });

  it('mentions Base UI as the primitive layer', () => {
    expect(source).toMatch(/Base UI|@base-ui-components/);
  });

  it('forbids @radix-ui imports', () => {
    expect(source.toLowerCase()).toMatch(/no.+radix|radix.+forbidden|radix.+banned|never.+radix/);
  });
});

describe('README.md', () => {
  it('links to docs/COMPONENTS.md', () => {
    expect(readme).toMatch(/docs\/COMPONENTS\.md/);
  });
});
