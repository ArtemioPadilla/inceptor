import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// Spec-DD: the schema is the source of truth. See docs/PRINCIPLES.md §3.
import { LoginSchema, type LoginValues } from '@/schemas/login';
import ErrorBoundary from './ErrorBoundary';

// Showcases the Form compound component (react-hook-form + Base UI Field +
// zod resolver). Submit handler is console.log only — this is a UI demo.
export default function ShowcaseForm() {
  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(values: LoginValues) {
    // Intentional: this is a showcase, not a real login form.
    console.log('[ShowcaseForm] submitted:', values);
  }

  return (
    <ErrorBoundary name="ShowcaseForm">
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-sm"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                We'll never share your email with anyone.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                />
              </FormControl>
              <FormDescription>Minimum 8 characters.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Sign in</Button>
      </form>
    </Form>
    </ErrorBoundary>
  );
}
