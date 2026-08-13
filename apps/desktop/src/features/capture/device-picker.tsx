import type { AudioDevice, AudioSourceKind } from '../../lib/native-capture.js';
import type { DeviceSelection } from './device-selection.js';

interface DevicePickerProps {
  devices: AudioDevice[];
  selection: DeviceSelection;
  levels?: Partial<Record<AudioSourceKind, number>>;
  refreshing?: boolean;
  onRefresh: () => void;
  onSelectionChange: (selection: DeviceSelection) => void;
}

function formatChannels(channels: number) {
  if (channels === 1) return 'mono';
  if (channels === 2) return 'stereo';
  return `${channels} channels`;
}

function SourceGroup({
  devices,
  level = 0,
  name,
  onChange,
  selectedId,
  source,
}: {
  devices: AudioDevice[];
  level?: number | undefined;
  name: string;
  onChange: (id: string) => void;
  selectedId: string | null;
  source: AudioSourceKind;
}) {
  return (
    <fieldset aria-label={name} className="grid min-w-0 gap-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <legend className="text-sm font-semibold text-[var(--cl-color-foreground)]">
            {name}
          </legend>
          <p className="mt-1 text-xs text-[var(--cl-color-muted-foreground)]">
            {source === 'microphone'
              ? 'Your selected voice input'
              : 'Shared meeting and call audio'}
          </p>
        </div>
        <meter
          aria-label={`${name} input level`}
          className="h-2 w-20 accent-[var(--cl-color-accent)]"
          max={1}
          min={0}
          value={Math.max(0, Math.min(1, level))}
        />
      </div>

      {devices.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--cl-color-border)] bg-[var(--cl-color-muted)]/45 px-4 py-5 text-sm text-[var(--cl-color-muted-foreground)]">
          No {name.toLowerCase()} device is currently available.
        </p>
      ) : (
        <div className="grid gap-2">
          {devices.map((device) => {
            const checked = selectedId === device.id;
            const description = `${Math.round(device.sampleRate / 1000)} kHz, ${formatChannels(device.channels)}`;
            return (
              <label
                className={`group grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border px-4 py-3.5 transition duration-200 ${
                  checked
                    ? 'border-[var(--cl-color-accent)] bg-[var(--cl-color-accent)]/10 shadow-[0_12px_36px_-24px_var(--cl-color-accent)]'
                    : 'border-[var(--cl-color-border)] bg-[var(--cl-color-surface)] hover:-translate-y-0.5 hover:border-[var(--cl-color-accent)]/55'
                }`}
                key={device.id}
              >
                <input
                  aria-label={`${device.name}, ${description}`}
                  checked={checked}
                  className="h-4 w-4 accent-[var(--cl-color-accent)]"
                  name={source}
                  onChange={() => onChange(device.id)}
                  type="radio"
                  value={device.id}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[var(--cl-color-foreground)]">
                    {device.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--cl-color-muted-foreground)]">
                    {description}
                  </span>
                </span>
                {device.isDefault ? (
                  <span className="rounded-full bg-[var(--cl-color-muted)] px-2.5 py-1 text-[0.6875rem] font-semibold text-[var(--cl-color-foreground)]">
                    Default
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

export function DevicePicker({
  devices,
  levels = {},
  onRefresh,
  onSelectionChange,
  refreshing = false,
  selection,
}: DevicePickerProps) {
  const microphones = devices.filter(
    (device) => device.source === 'microphone',
  );
  const outputs = devices.filter((device) => device.source === 'system-output');

  return (
    <section
      aria-labelledby="audio-sources-title"
      className="overflow-hidden rounded-[2rem] border border-[var(--cl-color-border)] bg-[var(--cl-color-surface)] shadow-[0_24px_80px_-52px_rgba(4,33,25,0.65)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--cl-color-border)] px-5 py-5 sm:px-6">
        <div>
          <h2
            className="text-lg font-semibold tracking-[-0.02em] text-[var(--cl-color-foreground)]"
            id="audio-sources-title"
          >
            Audio sources
          </h2>
          <p className="mt-1 text-sm text-[var(--cl-color-muted-foreground)]">
            Choose each source before reviewing consent and starting capture.
          </p>
        </div>
        <button
          className="rounded-full border border-[var(--cl-color-border)] bg-[var(--cl-color-background)] px-4 py-2 text-sm font-semibold text-[var(--cl-color-foreground)] transition hover:-translate-y-0.5 hover:border-[var(--cl-color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cl-color-accent)] disabled:cursor-wait disabled:opacity-60"
          disabled={refreshing}
          onClick={onRefresh}
          type="button"
        >
          {refreshing ? 'Refreshing...' : 'Refresh devices'}
        </button>
      </div>
      <div className="grid gap-7 p-5 sm:p-6 lg:grid-cols-2 lg:gap-6">
        <SourceGroup
          devices={microphones}
          level={levels.microphone}
          name="Microphone"
          onChange={(microphoneDeviceId) =>
            onSelectionChange({ ...selection, microphoneDeviceId })
          }
          selectedId={selection.microphoneDeviceId}
          source="microphone"
        />
        <SourceGroup
          devices={outputs}
          level={levels['system-output']}
          name="System output"
          onChange={(outputDeviceId) =>
            onSelectionChange({ ...selection, outputDeviceId })
          }
          selectedId={selection.outputDeviceId}
          source="system-output"
        />
      </div>
    </section>
  );
}
