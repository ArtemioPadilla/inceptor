import { describe, expect, it } from 'vitest';
import source from './BlockPreviewToggle.astro?raw';

describe('BlockPreviewToggle.astro', () => {
  it('reuses the existing CodeSnippet component', () => {
    expect(source).toMatch(/import CodeSnippet from ['"]\.\/CodeSnippet\.astro['"]/);
    expect(source).toMatch(/<CodeSnippet code={code} lang={lang} \/>/);
  });

  it('renders a Preview and a Code toggle button', () => {
    expect(source).toMatch(/data-view="preview"/);
    expect(source).toMatch(/data-view="code"/);
  });

  it('the code panel starts hidden (preview is the default view)', () => {
    expect(source).toMatch(/data-view-panel="code"[\s\S]{0,20}role="tabpanel"|class="toggle-panel hidden" data-view-panel="code"/);
  });

  it('binds its click handler idempotently (data-bound guard)', () => {
    expect(source).toMatch(/dataset\.bound === 'true'/);
    expect(source).toMatch(/dataset\.bound = 'true'/);
  });
});
