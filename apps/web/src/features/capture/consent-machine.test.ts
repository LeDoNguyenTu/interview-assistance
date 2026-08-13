import { describe, expect, it } from 'vitest';

import {
  createCaptureConsentState,
  reduceCaptureConsent,
} from './consent-machine.js';

describe('capture consent state', () => {
  it('requires a selected source and explicit acknowledgement before permission can be requested', () => {
    let state = createCaptureConsentState();

    state = reduceCaptureConsent(state, { type: 'continue' });
    expect(state).toMatchObject({
      error: 'Select at least one audio source to continue.',
      status: 'selecting',
    });

    state = reduceCaptureConsent(state, {
      selection: { displayAudio: false, microphone: true },
      type: 'select-sources',
    });
    state = reduceCaptureConsent(state, { type: 'continue' });
    state = reduceCaptureConsent(state, { type: 'confirm' });
    expect(state).toMatchObject({
      error: 'Confirm that every participant has consented before continuing.',
      status: 'explaining',
    });

    state = reduceCaptureConsent(state, { type: 'acknowledge-consent' });
    state = reduceCaptureConsent(state, { type: 'confirm' });
    state = reduceCaptureConsent(state, { type: 'request-permission' });

    expect(state).toMatchObject({
      selection: { displayAudio: false, microphone: true },
      status: 'requesting',
    });
  });

  it('makes cancellation and permission denial visible terminal states', () => {
    const cancelled = reduceCaptureConsent(createCaptureConsentState(), {
      type: 'cancel',
    });
    const denied = reduceCaptureConsent(
      { ...createCaptureConsentState(), status: 'requesting' },
      { type: 'permission-denied' },
    );

    expect(cancelled.status).toBe('cancelled');
    expect(denied).toMatchObject({
      error:
        'Browser permission was not granted. You can try again when ready.',
      status: 'failed',
    });
  });
});
