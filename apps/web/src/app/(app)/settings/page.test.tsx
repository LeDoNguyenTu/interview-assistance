// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import SettingsPage from './page';

afterEach(cleanup);

describe('SettingsPage', () => {
  it('makes the visible capture guardrails clear', () => {
    render(<SettingsPage />);

    expect(
      screen.getByRole('heading', { name: 'Workspace settings' }),
    ).toBeTruthy();
    expect(screen.getByText('Visible capture only')).toBeTruthy();
    expect(screen.getByText('Immediate stop control')).toBeTruthy();
  });
});
