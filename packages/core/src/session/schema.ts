import { z } from 'zod';

export const sessionModeSchema = z.enum(['coach', 'interviewer', 'defense']);
export type SessionMode = z.infer<typeof sessionModeSchema>;

export const sessionStatusSchema = z.enum([
  'draft',
  'ready',
  'capturing',
  'interrupted',
  'processing',
  'completed',
  'failed',
]);
export type SessionStatus = z.infer<typeof sessionStatusSchema>;

export const captureSourceSchema = z.enum([
  'microphone',
  'browser-tab',
  'system-audio',
  'upload',
]);
export type CaptureSource = z.infer<typeof captureSourceSchema>;

export const providerIdSchema = z.enum(['gemini', 'openai', 'fixture']);
export type ProviderId = z.infer<typeof providerIdSchema>;

export interface SessionRecord {
  id: string;
  ownerId: string;
  title: string;
  mode: SessionMode;
  status: SessionStatus;
  providerId: ProviderId;
  captureSources: CaptureSource[];
  consentedAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const sessionRecordSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  title: z.string(),
  mode: sessionModeSchema,
  status: sessionStatusSchema,
  providerId: providerIdSchema,
  captureSources: z.array(captureSourceSchema),
  consentedAt: z.string().datetime().nullable(),
  startedAt: z.string().datetime().nullable(),
  endedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
