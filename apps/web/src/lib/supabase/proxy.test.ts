import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { updateSession } from './proxy';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('updateSession', () => {
  it('allows public routes to render before Supabase is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');

    const response = await updateSession(
      new NextRequest('https://example.com/'),
    );

    expect(response.status).toBe(200);
  });
});
