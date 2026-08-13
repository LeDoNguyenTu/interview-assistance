// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ProviderSettingsForm } from './provider-settings-form';

afterEach(cleanup);

describe('ProviderSettingsForm', () => {
  it('provides labelled fields and never renders a stored raw API key', () => {
    render(
      <ProviderSettingsForm
        action={async () => ({ message: null, status: 'idle' })}
        credential={{
          keyHint: '7890',
          model: 'gpt-4.1-mini',
          provider: 'openai',
        }}
        provider="openai"
      />,
    );

    expect(screen.getByLabelText('OpenAI API key')).toBeTruthy();
    expect(screen.getByLabelText('OpenAI model')).toHaveProperty(
      'value',
      'gpt-4.1-mini',
    );
    expect(screen.getByText('Saved key ending in 7890')).toBeTruthy();
    expect(document.body.textContent).not.toContain('sk-user-owned-key');
  });
});
