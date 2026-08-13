// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SessionForm } from './session-form';

afterEach(cleanup);

describe('SessionForm', () => {
  it('shows server-provided provider availability without exposing configuration details', () => {
    render(
      <SessionForm
        action={async () => ({ message: null, status: 'idle' })}
        providers={[
          {
            available: true,
            id: 'fixture',
            label: 'Fixture preview',
            reason: null,
          },
          {
            available: false,
            id: 'openai',
            label: 'OpenAI',
            reason: 'Configure a server-side OpenAI provider to enable it.',
          },
        ]}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Provider' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Fixture preview' })).toHaveProperty(
      'disabled',
      false,
    );
    expect(screen.getByRole('option', { name: 'OpenAI' })).toHaveProperty(
      'disabled',
      true,
    );
    expect(screen.getByText(/server-side OpenAI provider/i)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/openai-secret|api[_-]?key/i);
  });
});
