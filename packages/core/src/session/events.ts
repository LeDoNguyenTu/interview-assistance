import { z } from 'zod';

import { consentRecordSchema } from '../consent/schema.js';

export const sessionEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PREPARE') }),
  z.object({ type: z.literal('CONFIRM_CONSENT'), consent: consentRecordSchema }),
  z.object({ type: z.literal('START_CAPTURE') }),
  z.object({ type: z.literal('INTERRUPT') }),
  z.object({ type: z.literal('RESUME') }),
  z.object({ type: z.literal('STOP_CAPTURE') }),
  z.object({ type: z.literal('COMPLETE_PROCESSING') }),
  z.object({ type: z.literal('FAIL') }),
  z.object({ type: z.literal('RESET') }),
]);

export type SessionEvent = z.infer<typeof sessionEventSchema>;
