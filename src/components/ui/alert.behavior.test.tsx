// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from './alert';

describe('AlertTitle', () => {
  // Regression: AlertTitle used to hardcode <h5>, which produced a
  // Lighthouse/axe heading-order violation on every page that renders an
  // Alert without an intervening <h4> (e.g. /gallery/, whose own hierarchy
  // only reaches <h3> before an Alert demo instance). CardTitle already
  // avoids this by rendering a plain, unlevelled <div> — AlertTitle now
  // matches that convention since its heading level is a consumer concern,
  // not something this reusable primitive should assert.
  it('renders as a non-heading element', () => {
    render(
      <Alert>
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>Check your connection and try again.</AlertDescription>
      </Alert>,
    );
    const title = screen.getByText('Something went wrong');
    expect(title.tagName).toBe('DIV');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
