import type { NextRequest } from 'next/server';

import { getNeonAuth } from './lib/auth/neon-auth';

export async function proxy(request: NextRequest) {
  return getNeonAuth().middleware({ loginUrl: '/sign-in' })(request);
}

export const config = {
  matcher: ['/dashboard/:path*', '/sessions/:path*'],
};
