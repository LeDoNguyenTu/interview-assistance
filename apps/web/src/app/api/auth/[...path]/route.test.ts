import { describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  handler: vi.fn(() => ({
    GET: vi.fn(() => new Response(null, { status: 204 })),
  })),
  getNeonAuth: vi.fn(),
}));

dependencies.getNeonAuth.mockReturnValue({ handler: dependencies.handler });

vi.mock('../../../../lib/auth/neon-auth.js', () => ({
  getNeonAuth: dependencies.getNeonAuth,
}));

import { GET } from './route.js';

describe('Neon Auth route', () => {
  it('initializes Neon Auth only when an auth request reaches the route', async () => {
    expect(dependencies.getNeonAuth).not.toHaveBeenCalled();

    const response = await GET(
      new Request('https://candorlens.test/api/auth'),
      {
        params: Promise.resolve({ path: [] }),
      },
    );

    expect(response.status).toBe(204);
    expect(dependencies.getNeonAuth).toHaveBeenCalledTimes(1);
  });
});
