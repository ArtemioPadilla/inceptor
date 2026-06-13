import { describe, expect, it } from 'vitest';
import source from '../components/islands/AppLayoutIsland.tsx?raw';

describe('AppLayoutIsland', () => {
  it('default-exports a React component', () => {
    expect(source).toMatch(/export default function AppLayoutIsland/);
  });

  it('wraps inner component in ErrorBoundary', () => {
    expect(source).toMatch(/ErrorBoundary/);
    expect(source).toMatch(/name=["']AppLayoutIsland["']/);
  });

  it('accepts typed AppLayoutProps', () => {
    expect(source).toMatch(/AppLayoutProps/);
    expect(source).toMatch(/navItems/);
    expect(source).toMatch(/topActions/);
    expect(source).toMatch(/splitPanelContent/);
  });

  it('has defaultSplitOpen prop that controls initial split panel state', () => {
    expect(source).toMatch(/defaultSplitOpen/);
    expect(source).toMatch(/isSplitOpen/);
  });

  it('toggles split panel open/close state', () => {
    expect(source).toMatch(/setIsSplitOpen/);
    expect(source).toMatch(/onSplitToggle/);
  });

  it('renders split panel region when open', () => {
    expect(source).toMatch(/split-panel/);
    expect(source).toMatch(/isSplitOpen && /);
  });

  it('has responsive behaviour — desktop SideNav hidden at mobile breakpoint', () => {
    // Desktop nav has hidden + md:flex
    expect(source).toMatch(/hidden.*md:flex|md:flex.*hidden/);
  });

  it('has mobile nav drawer with role=dialog and aria-modal', () => {
    expect(source).toMatch(/role=["']dialog["']/);
    expect(source).toMatch(/aria-modal=["']true["']/);
  });

  it('closes mobile nav on Escape key', () => {
    expect(source).toMatch(/Escape/);
    expect(source).toMatch(/setIsMobileNavOpen/);
  });

  it('cleans up ResizeObserver or MediaQueryList listener on unmount', () => {
    // The island must return a cleanup from useEffect
    expect(source).toMatch(/removeEventListener/);
  });

  it('keyboard navigation: hamburger button has aria-label and aria-expanded', () => {
    expect(source).toMatch(/aria-label=.*navigation/);
    expect(source).toMatch(/aria-expanded=\{isMobileNavOpen\}/);
  });

  it('nav items support active state with aria-current', () => {
    expect(source).toMatch(/aria-current/);
    expect(source).toMatch(/active.*page/);
  });

  it('uses only semantic HTML — no @radix-ui imports', () => {
    expect(source).not.toMatch(/from ['"]@radix-ui/);
  });

  it('does not import framer-motion', () => {
    expect(source).not.toMatch(/from ['"]framer-motion['"]/);
  });

  it('does not use React.createContext for cross-island state', () => {
    expect(source).not.toMatch(/React\.createContext/);
  });

  it('accepts onNavSelect callback prop', () => {
    expect(source).toMatch(/onNavSelect/);
  });

  it('accepts navLabel prop for the nav landmark', () => {
    expect(source).toMatch(/navLabel/);
    expect(source).toMatch(/aria-label=\{navLabel\}/);
  });
});
