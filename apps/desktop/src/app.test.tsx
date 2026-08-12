// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DesktopApp } from './app.js';

afterEach(cleanup);

describe('DesktopApp', () => {
  it('shows the CandorLens shell and a visible capture-unavailable status', () => {
    render(<DesktopApp />);

    expect(screen.getByRole('link', { name: 'CandorLens home' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'CandorLens desktop' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Capture unavailable');
    expect(screen.queryByRole('button', { name: /capture/i })).toBeNull();
  });
});
