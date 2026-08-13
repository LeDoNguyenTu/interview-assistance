import { NextResponse, type NextRequest } from 'next/server';

import { getNeonAuth } from './lib/auth/neon-auth';
import { shouldAuthenticateAtProxy } from './proxy-config';

export async function proxy(request: NextRequest) {
  if (!shouldAuthenticateAtProxy(request.headers)) {
    return NextResponse.next();
  }

  return getNeonAuth().middleware({ loginUrl: '/sign-in' })(request);
}

export const config = {
  matcher: ['/dashboard/:path*', '/sessions/:path*'],
};
