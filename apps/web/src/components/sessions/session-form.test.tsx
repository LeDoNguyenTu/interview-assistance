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
    expect(
      screen.getByRole('option', { name: 'Fixture preview' }),
    ).toHaveProperty('disabled', false);
    expect(screen.getByRole('option', { name: 'OpenAI' })).toHaveProperty(
      'disabled',
      true,
    );
    expect(screen.getByText(/server-side OpenAI provider/i)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/openai-secret|api[_-]?key/i);
  });

  it('gives native session menus readable dark surfaces and visible focus states', () => {
    render(
      <SessionForm
        action={async () => ({ message: null, status: 'idle' })}
        providers={[
          {
            available: true,
            id: 'gemini',
            label: 'Gemini',
            reason: null,
          },
          {
            available: false,
            id: 'openai',
            label: 'OpenAI',
            reason: 'Add an OpenAI key in Settings to enable it.',
          },
        ]}
      />,
    );

    const modeSelect = screen.getByRole('combobox', {
      name: 'Interview mode',
    });
    const coachOption = screen.getByRole('option', { name: 'Coach' });
    const providerSelect = screen.getByRole('combobox', { name: 'Provider' });
    const geminiOption = screen.getByRole('option', { name: 'Gemini' });
    const openAiOption = screen.getByRole('option', { name: 'OpenAI' });

    expect(modeSelect.className).toContain('[color-scheme:dark]');
    expect(coachOption.className).toContain('bg-[#10231e]');
    expect(providerSelect.className).toContain('[color-scheme:dark]');
    expect(providerSelect.className).toContain('focus-visible:ring-2');
    expect(geminiOption.className).toContain('bg-[#10231e]');
    expect(geminiOption.className).toContain('text-[#f3fbf7]');
    expect(openAiOption.className).toContain('disabled:text-[#8ca399]');
  });
});
