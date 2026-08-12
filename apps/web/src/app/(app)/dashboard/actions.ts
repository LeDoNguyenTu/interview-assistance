'use server';

import { redirect } from 'next/navigation';

import { getNeonAuth } from '../../../lib/auth/neon-auth';

export async function signOut() {
  await getNeonAuth().signOut();

  redirect('/sign-in');
}
