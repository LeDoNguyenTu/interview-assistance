import { z } from 'zod';

import { captureSourceSchema } from '../session/schema.js';

export interface ConsentRecord {
  sessionId: string;
  ownerId: string;
  consentVersion: string;
  acceptedSources: z.infer<typeof captureSourceSchema>[];
  acceptedAt: string;
  locale: string;
}

export const consentRecordSchema = z.object({
  sessionId: z.string().min(1),
  ownerId: z.string().min(1),
  consentVersion: z.string().min(1),
  acceptedSources: z.array(captureSourceSchema).min(1),
  acceptedAt: z.string().datetime(),
  locale: z.string().min(1),
});
