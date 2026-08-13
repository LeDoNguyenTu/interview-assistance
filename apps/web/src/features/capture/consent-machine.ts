export type CaptureSelection = {
  microphone: boolean;
  displayAudio: boolean;
};

export type CaptureConsentStatus =
  | 'selecting'
  | 'explaining'
  | 'confirmed'
  | 'requesting'
  | 'ready'
  | 'cancelled'
  | 'failed';

export type CaptureConsentState = {
  status: CaptureConsentStatus;
  selection: CaptureSelection;
  consentAcknowledged: boolean;
  error: string | null;
};

export type CaptureConsentEvent =
  | { type: 'select-sources'; selection: CaptureSelection }
  | { type: 'continue' }
  | { type: 'acknowledge-consent' }
  | { type: 'confirm' }
  | { type: 'request-permission' }
  | { type: 'permission-granted' }
  | { type: 'permission-denied' }
  | { type: 'cancel' }
  | { type: 'reset' };

const emptySelection: CaptureSelection = {
  displayAudio: false,
  microphone: false,
};

export function createCaptureConsentState(): CaptureConsentState {
  return {
    consentAcknowledged: false,
    error: null,
    selection: emptySelection,
    status: 'selecting',
  };
}

function hasSource(selection: CaptureSelection): boolean {
  return selection.microphone || selection.displayAudio;
}

export function reduceCaptureConsent(
  state: CaptureConsentState,
  event: CaptureConsentEvent,
): CaptureConsentState {
  switch (event.type) {
    case 'select-sources':
      return {
        ...state,
        error: null,
        selection: event.selection,
        status: 'selecting',
      };
    case 'continue':
      return hasSource(state.selection)
        ? { ...state, error: null, status: 'explaining' }
        : {
            ...state,
            error: 'Select at least one audio source to continue.',
            status: 'selecting',
          };
    case 'acknowledge-consent':
      return {
        ...state,
        consentAcknowledged: !state.consentAcknowledged,
        error: null,
      };
    case 'confirm':
      return state.status === 'explaining' && state.consentAcknowledged
        ? { ...state, error: null, status: 'confirmed' }
        : {
            ...state,
            error:
              'Confirm that every participant has consented before continuing.',
            status: 'explaining',
          };
    case 'request-permission':
      return state.status === 'confirmed'
        ? { ...state, error: null, status: 'requesting' }
        : state;
    case 'permission-granted':
      return state.status === 'requesting'
        ? { ...state, error: null, status: 'ready' }
        : state;
    case 'permission-denied':
      return {
        ...state,
        error:
          'Browser permission was not granted. You can try again when ready.',
        status: 'failed',
      };
    case 'cancel':
      return { ...state, error: null, status: 'cancelled' };
    case 'reset':
      return createCaptureConsentState();
  }
}
