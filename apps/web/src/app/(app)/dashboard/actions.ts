'use server';

import { redirect } from 'next/navigation';

import { getValidatedClaims } from '../../../lib/auth/require-user';
import { createClient } from '../../../lib/supabase/server';

export async function signOut() {
  const supabase = await createClient();
  const claims = await getValidatedClaims(supabase);

  if (claims) {
    await supabase.auth.signOut();
  }

  redirect('/sign-in');
}
