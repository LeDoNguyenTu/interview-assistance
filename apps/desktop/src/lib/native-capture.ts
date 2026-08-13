import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { listen as tauriListen } from '@tauri-apps/api/event';
import { z } from 'zod';

const captureStateSchema = z.enum([
  'idle',
  'preparing',
  'ready',
  'capturing',
  'interrupted',
  'stopping',
  'failed',
]);

const audioSourceSchema = z.enum(['microphone', 'system-output']);

const audioDeviceSchema = z.object({
  channels: z.number().int().positive(),
  id: z.string().min(1),
  isDefault: z.boolean(),
  name: z.string().min(1),
  sampleRate: z.number().int().positive(),
  source: audioSourceSchema,
});

const captureConfigSchema = z.object({
  frameDurationMs: z.number().int().min(10).max(100),
  microphoneDeviceId: z.string().min(1).nullable(),
  outputDeviceId: z.string().min(1).nullable(),
  sessionId: z.string().min(1),
  targetSampleRate: z.number().int().positive(),
});

const captureStatusSchema = z.object({ state: captureStateSchema });

const audioFrameSchema = z.object({
  channels: z.number().int().positive(),
  pcmBase64: z.string().min(1),
  sampleRate: z.number().int().positive(),
  sequence: z.number().int().nonnegative(),
  source: audioSourceSchema,
  timestampMs: z.number().nonnegative(),
});

const levelSchema = z.object({
  peak: z.number().min(0).max(1),
  rms: z.number().min(0).max(1),
  source: audioSourceSchema,
});

const deviceLostSchema = z.object({
  deviceId: z.string().min(1),
  source: audioSourceSchema,
});

const errorCategorySchema = z.enum([
  'permission',
  'device-unavailable',
  'device-lost',
  'format',
  'buffer',
  'network',
  'internal',
]);

const nativeErrorSchema = z.object({
  category: errorCategorySchema,
  message: z.string().optional(),
});

export type AudioDevice = z.infer<typeof audioDeviceSchema>;
export type CaptureConfig = z.infer<typeof captureConfigSchema>;
export type CaptureStatus = z.infer<typeof captureStatusSchema>;
export type AudioFrame = z.infer<typeof audioFrameSchema>;
export type CaptureLevel = z.infer<typeof levelSchema>;
export type DeviceLost = z.infer<typeof deviceLostSchema>;
export type NativeErrorCategory = z.infer<typeof errorCategorySchema>;

type NativeEvent<T> = { payload: T };
type Invoke = (
  command: string,
  args?: Record<string, unknown>,
) => Promise<unknown>;
type Listen = (
  event: string,
  handler: (event: NativeEvent<unknown>) => void,
) => Promise<() => void>;

export interface NativeCaptureAdapter {
  invoke: Invoke;
  listen: Listen;
}

const publicErrorMessages: Record<NativeErrorCategory, string> = {
  buffer: 'The local audio buffer could not continue safely.',
  'device-lost': 'The selected audio device disconnected.',
  'device-unavailable': 'The selected audio device is unavailable.',
  format: 'This audio format is not supported.',
  internal: 'Desktop capture encountered an unexpected error.',
  network: 'The network connection is temporarily unavailable.',
  permission: 'Windows did not grant audio capture permission.',
};

export class NativeCaptureError extends Error {
  constructor(public readonly category: NativeErrorCategory) {
    super(publicErrorMessages[category]);
    this.name = 'NativeCaptureError';
  }
}

function normalizeError(error: unknown): NativeCaptureError {
  if (error instanceof NativeCaptureError) return error;
  const parsed = nativeErrorSchema.safeParse(error);
  return new NativeCaptureError(
    parsed.success ? parsed.data.category : 'internal',
  );
}

function parseResult<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new NativeCaptureError('internal');
  return parsed.data;
}

async function call<T>(
  adapter: NativeCaptureAdapter,
  command: string,
  schema: z.ZodType<T>,
  args?: Record<string, unknown>,
): Promise<T> {
  try {
    const result = args
      ? await adapter.invoke(command, args)
      : await adapter.invoke(command);
    return parseResult(schema, result);
  } catch (error) {
    throw normalizeError(error);
  }
}

function subscribe<T>(
  adapter: NativeCaptureAdapter,
  event: string,
  schema: z.ZodType<T>,
  handler: (payload: T) => void,
) {
  return adapter.listen(event, ({ payload }) => {
    handler(parseResult(schema, payload));
  });
}

export function createNativeCaptureBridge(
  adapter: NativeCaptureAdapter = {
    invoke: tauriInvoke,
    listen: tauriListen,
  },
) {
  return {
    captureStatus: () => call(adapter, 'capture_status', captureStatusSchema),
    discardBuffer: () =>
      call(
        adapter,
        'discard_buffer',
        z.object({ discardedFrames: z.number().int().nonnegative() }),
      ),
    listAudioDevices: () =>
      call(adapter, 'list_audio_devices', z.array(audioDeviceSchema)),
    onAudioFrame: (handler: (payload: AudioFrame) => void) =>
      subscribe(adapter, 'capture://audio-frame', audioFrameSchema, handler),
    onDeviceLost: (handler: (payload: DeviceLost) => void) =>
      subscribe(adapter, 'capture://device-lost', deviceLostSchema, handler),
    onError: (handler: (payload: NativeCaptureError) => void) =>
      subscribe(adapter, 'capture://error', nativeErrorSchema, (payload) =>
        handler(new NativeCaptureError(payload.category)),
      ),
    onLevel: (handler: (payload: CaptureLevel) => void) =>
      subscribe(adapter, 'capture://level', levelSchema, handler),
    onState: (handler: (payload: CaptureStatus) => void) =>
      subscribe(adapter, 'capture://state', captureStatusSchema, handler),
    prepareCapture: (config: CaptureConfig, consentToken: string) =>
      call(adapter, 'prepare_capture', captureStatusSchema, {
        config: captureConfigSchema.parse(config),
        consentToken: z.string().min(1).parse(consentToken),
      }),
    startCapture: () => call(adapter, 'start_capture', captureStatusSchema),
    stopCapture: () => call(adapter, 'stop_capture', captureStatusSchema),
  };
}
