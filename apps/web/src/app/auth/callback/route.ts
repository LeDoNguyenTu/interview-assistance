import { type NextRequest, NextResponse } from 'next/server';

import { getSafeCallbackRedirectPath } from './callback-redirect';

export async function GET(request: NextRequest) {
  const nextPath = getSafeCallbackRedirectPath(
    request.nextUrl.searchParams.get('next'),
  );

  return NextResponse.redirect(new URL(nextPath, request.url));
}
