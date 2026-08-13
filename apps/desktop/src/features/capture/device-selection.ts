import type { AudioDevice } from '../../lib/native-capture.js';

export interface DeviceSelection {
  microphoneDeviceId: string | null;
  outputDeviceId: string | null;
}

function chooseDevice(
  devices: AudioDevice[],
  currentId: string | null,
): string | null {
  if (currentId && devices.some((device) => device.id === currentId)) {
    return currentId;
  }
  return (
    devices.find((device) => device.isDefault)?.id ?? devices[0]?.id ?? null
  );
}

export function reconcileDeviceSelection(
  devices: AudioDevice[],
  current: DeviceSelection = {
    microphoneDeviceId: null,
    outputDeviceId: null,
  },
): DeviceSelection {
  const microphones = devices.filter(
    (device) => device.source === 'microphone',
  );
  const outputs = devices.filter((device) => device.source === 'system-output');

  return {
    microphoneDeviceId: chooseDevice(microphones, current.microphoneDeviceId),
    outputDeviceId: chooseDevice(outputs, current.outputDeviceId),
  };
}
