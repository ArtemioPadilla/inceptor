import { describe, expect, it } from 'vitest';
import source from './ThemeIndicator.tsx?raw';

describe('ThemeIndicator island', () => {
  it('reads from $theme via useStore (@nanostores/react)', () => {
    expect(source).toMatch(/from ['"]@nanostores\/react['"]/);
    expect(source).toMatch(/\$theme/);
  });

  it('exports default', () => {
    expect(source).toMatch(/export default/);
  });

  it('does not use React.createContext or useContext for theme', () => {
    expect(source).not.toMatch(/createContext/);
    expect(source).not.toMatch(/useContext/);
  });

  it('includes data-testid for automated testing', () => {
    expect(source).toMatch(/data-testid="theme-indicator"/);
  });
});
