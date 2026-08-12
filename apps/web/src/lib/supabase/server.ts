import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('Supabase public configuration is missing.');
  }

  return { publishableKey, url };
}

export async function createClient() {
  const cookieStore = await cookies();
  const { publishableKey, url } = getPublicSupabaseConfig();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, options, value }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies. proxy.ts persists refreshes.
        }
      },
    },
  });
}
