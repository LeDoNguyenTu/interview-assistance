import type { BrowserCaptureCapabilities } from '../browser-capabilities';
import type { CaptureSelection } from '../consent-machine';

type SourcePickerProps = {
  capabilities: BrowserCaptureCapabilities;
  selection: CaptureSelection;
  onChange(selection: CaptureSelection): void;
};

export function SourcePicker({
  capabilities,
  onChange,
  selection,
}: Readonly<SourcePickerProps>) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-base font-semibold tracking-[-0.02em] text-white">
        Audio sources
      </legend>
      <p className="text-sm leading-6 text-[#b9c9c4]">
        Pick the audio you intend to capture. The browser decides whether a
        selected display source includes audio.
      </p>
      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 transition-colors duration-200 hover:bg-white/[0.07]">
        <input
          aria-label="Microphone"
          checked={selection.microphone}
          disabled={!capabilities.microphone}
          onChange={(event) =>
            onChange({ ...selection, microphone: event.target.checked })
          }
          type="checkbox"
        />
        <span>
          <span className="block text-sm font-semibold text-white">
            Microphone
          </span>
          <span className="block text-sm text-[#b9c9c4]">
            Your local microphone input.
          </span>
        </span>
      </label>
      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 transition-colors duration-200 hover:bg-white/[0.07]">
        <input
          aria-label="Browser display audio"
          checked={selection.displayAudio}
          disabled={!capabilities.displayMedia}
          onChange={(event) =>
            onChange({ ...selection, displayAudio: event.target.checked })
          }
          type="checkbox"
        />
        <span>
          <span className="block text-sm font-semibold text-white">
            Browser display audio
          </span>
          <span className="block text-sm text-[#b9c9c4]">
            Available after display source selection when your browser exposes
            an audio track.
          </span>
        </span>
      </label>
      {!capabilities.secureContext ? (
        <p
          className="text-sm text-[var(--cl-color-status-warning)]"
          role="alert"
        >
          Capture requires a secure browser context.
        </p>
      ) : null}
    </fieldset>
  );
}
