import 'server-only';

import { redirect } from 'next/navigation';

import { createClient } from '../supabase/server';
import { requireUserForRoute, type ValidatedClaims } from './require-user';

export async function requireUser(): Promise<ValidatedClaims> {
  return requireUserForRoute(await createClient(), redirect);
}
