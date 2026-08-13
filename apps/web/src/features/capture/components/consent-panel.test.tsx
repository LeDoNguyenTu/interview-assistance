// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConsentPanel } from './consent-panel';

afterEach(cleanup);

describe('ConsentPanel', () => {
  it('does not request browser permission until source selection and consent acknowledgement are complete', () => {
    const onRequestCapture = vi.fn();
    render(
      <ConsentPanel
        capabilities={{
          audioWorklet: true,
          displayAudioRequested: true,
          displayMedia: true,
          microphone: true,
          secureContext: true,
        }}
        onRequestCapture={onRequestCapture}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('alert').textContent).toContain(
      'Select at least one audio source',
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Microphone' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(
      screen.getByRole('button', { name: 'Confirm and choose sources' }),
    ).toHaveProperty('disabled', true);

    fireEvent.click(
      screen.getByRole('checkbox', { name: /participants have consented/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm and choose sources' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Request browser permission' }),
    );

    expect(onRequestCapture).toHaveBeenCalledWith({
      displayAudio: false,
      microphone: true,
    });
  });
});
