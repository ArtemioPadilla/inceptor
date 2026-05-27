import { describe, expect, it } from 'vitest';
import source from './QueryProvider.tsx?raw';

describe('QueryProvider island', () => {
  it('imports QueryClientProvider from @tanstack/react-query', () => {
    expect(source).toMatch(/QueryClientProvider/);
  });

  it('uses createQueryClient from @/lib/queryClient', () => {
    expect(source).toMatch(/createQueryClient/);
  });

  it('uses attachPersister from @/lib/queryClient', () => {
    expect(source).toMatch(/attachPersister/);
  });

  it('default-exports a component', () => {
    expect(source).toMatch(/export default/);
  });

  it('accepts an optional idbKey prop', () => {
    expect(source).toMatch(/idbKey/);
  });

  it('does not import from framer-motion', () => {
    expect(source).not.toMatch(/from ['"]framer-motion['"]/);
  });
});
