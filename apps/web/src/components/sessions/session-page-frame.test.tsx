// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SessionBackLink, SessionPageFrame } from './session-page-frame';

afterEach(cleanup);

describe('session page frame', () => {
  it('keeps deep session pages on one centered content line', () => {
    render(
      <SessionPageFrame>
        <SessionBackLink />
        <p>Session content</p>
      </SessionPageFrame>,
    );

    const frame = screen.getByTestId('session-page-frame');
    expect(frame.className).toContain('mx-auto');
    expect(frame.className).toContain('max-w-6xl');
    expect(frame.textContent).toContain('Session content');
  });

  it('renders predictable, high-contrast back navigation', () => {
    render(<SessionBackLink />);

    const link = screen.getByRole('link', { name: 'Back to sessions' });
    expect(link).toHaveProperty('href', expect.stringContaining('/sessions'));
    expect(link.className).toContain('border-white/20');
    expect(link.className).toContain('text-white');
    expect(link.querySelector('svg')).toBeTruthy();
  });
});
