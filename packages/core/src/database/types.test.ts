import { describe, expect, it } from 'vitest';

import type { Database } from './types.js';

describe('Database insert types', () => {
  it('allows an utterance insert to omit text because the database defaults it to an empty string', () => {
    const insert: Database['public']['Tables']['utterances']['Insert'] = {
      user_id: 'owner-1',
      session_id: 'session-1',
      sequence: 0,
      speaker: 'candidate',
      start_ms: 0,
      end_ms: 100,
    };

    expect(insert.text).toBeUndefined();
  });
});
