import { describe, expect, it } from 'vitest';
import source from './MotionDemo.tsx?raw';

describe('MotionDemo', () => {
  it('imports from motion/react (NOT framer-motion)', () => {
    expect(source).toMatch(/from\s+['"]motion\/react['"]/);
    expect(source).not.toMatch(/from\s+['"]framer-motion['"]/);
  });

  it('uses LazyMotion + domAnimation', () => {
    expect(source).toMatch(/LazyMotion/);
    expect(source).toMatch(/domAnimation/);
  });

  it('uses m.* (not motion.*) inside LazyMotion to stay lazy', () => {
    expect(source).toMatch(/<m\.div/);
    expect(source).not.toMatch(/<motion\.div/);
  });

  it('default exports a component', () => {
    expect(source).toMatch(/export default function MotionDemo/);
  });
});
