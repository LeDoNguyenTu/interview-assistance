// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DevicePicker } from './device-picker.js';

afterEach(cleanup);

const devices = [
  {
    channels: 1,
    id: 'microphone:a',
    isDefault: true,
    name: 'USB microphone',
    sampleRate: 48_000,
    source: 'microphone' as const,
  },
  {
    channels: 2,
    id: 'system-output:a',
    isDefault: true,
    name: 'Speakers',
    sampleRate: 48_000,
    source: 'system-output' as const,
  },
];

describe('DevicePicker', () => {
  it('shows both source groups, defaults, levels, and refresh', () => {
    render(
      <DevicePicker
        devices={devices}
        levels={{ microphone: 0.42, 'system-output': 0.7 }}
        onRefresh={vi.fn()}
        onSelectionChange={vi.fn()}
        selection={{
          microphoneDeviceId: 'microphone:a',
          outputDeviceId: 'system-output:a',
        }}
      />,
    );

    expect(screen.getByRole('group', { name: 'Microphone' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'System output' })).toBeTruthy();
    expect(screen.getAllByText('Default')).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: 'Refresh devices' }),
    ).toBeTruthy();
    expect(screen.getAllByRole('meter')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /start|capture/i })).toBeNull();
  });

  it('changes selection without starting capture', () => {
    const onSelectionChange = vi.fn();
    render(
      <DevicePicker
        devices={[
          ...devices,
          {
            channels: 1,
            id: 'microphone:b',
            isDefault: false,
            name: 'USB microphone',
            sampleRate: 48_000,
            source: 'microphone',
          },
        ]}
        onRefresh={vi.fn()}
        onSelectionChange={onSelectionChange}
        selection={{
          microphoneDeviceId: 'microphone:a',
          outputDeviceId: 'system-output:a',
        }}
      />,
    );

    fireEvent.click(
      screen.getAllByRole('radio', {
        name: 'USB microphone, 48 kHz, mono',
      })[1]!,
    );
    expect(onSelectionChange).toHaveBeenCalledWith({
      microphoneDeviceId: 'microphone:b',
      outputDeviceId: 'system-output:a',
    });
  });
});
