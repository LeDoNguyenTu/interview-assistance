// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AppChrome } from './app-chrome';

afterEach(cleanup);

describe('AppChrome', () => {
  it('provides a labelled signed-in navigation shell with an active location', () => {
    render(
      <AppChrome activePath="/sessions">
        <p>Session content</p>
      </AppChrome>,
    );

    expect(
      screen.getByRole('navigation', { name: 'Workspace navigation' }),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sessions' })).toHaveProperty(
      'ariaCurrent',
      'page',
    );
    expect(screen.getByRole('main').textContent).toContain('Session content');
    expect(screen.getByRole('contentinfo')).toBeTruthy();
    expect(screen.getByText('\u00A9 2026 CandorLens')).toBeTruthy();
    expect(screen.getByRole('main').className).not.toContain('max-w-');
    expect(screen.getByRole('main').className).toContain('py-4');
    expect(screen.getByRole('main').className).not.toContain('sm:py-8');
    expect(
      screen.getByRole('link', { name: 'Account settings' }),
    ).toHaveProperty('href', expect.stringContaining('/settings'));
  });
});
