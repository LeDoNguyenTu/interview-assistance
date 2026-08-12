'use client';

import { createBrowserClient } from '@supabase/ssr';

function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('Supabase public configuration is missing.');
  }

  return { publishableKey, url };
}

export function createClient() {
  const { publishableKey, url } = getPublicSupabaseConfig();
  return createBrowserClient(url, publishableKey);
}
