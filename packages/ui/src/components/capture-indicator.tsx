'use client';

import { BrowserIcon } from '@phosphor-icons/react/Browser';
import { MicrophoneIcon } from '@phosphor-icons/react/Microphone';
import { PauseCircleIcon } from '@phosphor-icons/react/PauseCircle';
import { SpeakerHighIcon } from '@phosphor-icons/react/SpeakerHigh';
import { StopIcon } from '@phosphor-icons/react/Stop';
import { UploadSimpleIcon } from '@phosphor-icons/react/UploadSimple';

import type { CaptureSource } from '@candorlens/core';

import { cn } from '../lib/cn';
import { Button } from './button';

export interface CaptureIndicatorProps {
  state: 'idle' | 'starting' | 'capturing' | 'interrupted' | 'stopping';
  sources: CaptureSource[];
  elapsedSeconds?: number;
  onStop?: () => void;
}

const stateCopy: Record<CaptureIndicatorProps['state'], string> = {
  idle: 'Ready to capture',
  starting: 'Starting capture',
  capturing: 'Capturing',
  interrupted: 'Capture interrupted',
  stopping: 'Stopping capture',
};

const sourceLabels: Record<CaptureSource, string> = {
  microphone: 'Microphone',
  'browser-tab': 'Browser tab',
  'system-audio': 'System audio',
  upload: 'Uploaded audio',
};

function formatElapsed(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} elapsed`;
}

function StateIcon({ state }: Pick<CaptureIndicatorProps, 'state'>) {
  const props = {
    'aria-hidden': true,
    'data-testid': 'capture-indicator-icon',
    size: 20,
    weight: 'regular' as const,
  };

  if (state === 'interrupted') return <PauseCircleIcon {...props} />;
  return <MicrophoneIcon {...props} />;
}

export function CaptureIndicator({
  elapsedSeconds,
  onStop,
  sources,
  state,
}: CaptureIndicatorProps) {
  const isStopAvailable = state === 'capturing' || state === 'interrupted';
  const sourceSummary = sources.map((source) => sourceLabels[source]).join(', ');

  return (
    <section
      aria-label="Capture status"
      className={cn(
        'flex flex-col gap-2 rounded-[var(--cl-radius-card)] border border-[var(--cl-color-border)] bg-[var(--cl-color-surface)] p-4 shadow-[var(--cl-shadow-card)] sm:flex-row sm:items-center sm:justify-between',
        state === 'interrupted' && 'border-[var(--cl-color-destructive)]',
      )}
    >
      <div
        aria-atomic="true"
        aria-live="polite"
        className="flex min-w-0 items-center gap-2"
        role="status"
      >
        <span className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[var(--cl-color-accent)] text-[var(--cl-color-accent-foreground)]">
          <StateIcon state={state} />
        </span>
        <div className="min-w-0">
          <p className="font-bold tracking-[-0.01em]">{stateCopy[state]}</p>
          <p className="text-sm text-[var(--cl-color-muted-foreground)]">
            {sourceSummary || 'No capture sources selected'}
          </p>
        </div>
      </div>
      {elapsedSeconds === undefined ? null : (
        <p
          aria-label="Elapsed capture time"
          className="font-[family-name:var(--cl-font-mono)] text-sm text-[var(--cl-color-muted-foreground)]"
          role="timer"
        >
          {formatElapsed(elapsedSeconds)}
        </p>
      )}
      {isStopAvailable ? (
        <Button onClick={onStop} size="compact" variant="secondary">
          <StopIcon aria-hidden="true" size={20} weight="regular" />
          Stop capture
        </Button>
      ) : null}
    </section>
  );
}

export const captureSourceIcons: Record<CaptureSource, typeof MicrophoneIcon> = {
  microphone: MicrophoneIcon,
  'browser-tab': BrowserIcon,
  'system-audio': SpeakerHighIcon,
  upload: UploadSimpleIcon,
};
