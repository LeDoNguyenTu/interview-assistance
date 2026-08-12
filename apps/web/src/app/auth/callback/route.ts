import { type NextRequest, NextResponse } from 'next/server';

import { createClient } from '../../../lib/supabase/server';
import { getSafeCallbackRedirectPath } from './callback-redirect';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const nextPath = getSafeCallbackRedirectPath(
    request.nextUrl.searchParams.get('next'),
  );

  if (!code) {
    return NextResponse.redirect(new URL('/sign-in?error=auth', request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/sign-in?error=auth', request.url));
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
