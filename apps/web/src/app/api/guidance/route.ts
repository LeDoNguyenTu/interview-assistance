import { NextResponse } from 'next/server';

import { getAuthenticatedUser } from '../../../lib/auth/neon-auth';
import {
  GuidanceDispatcherError,
  generateGuidance,
  type GuidanceInput,
} from '../../../lib/guidance/dispatcher';

const noStore = { 'Cache-Control': 'no-store' };

export async function POST(request: Request) {
  const claims = await getAuthenticatedUser();
  if (!claims) {
    return NextResponse.json(
      { error: 'Sign in to generate guidance.' },
      { headers: noStore, status: 401 },
    );
  }

  let input: GuidanceInput;
  try {
    input = (await request.json()) as GuidanceInput;
  } catch {
    return NextResponse.json(
      { error: 'Enter valid guidance details.' },
      { headers: noStore, status: 400 },
    );
  }

  try {
    return NextResponse.json(await generateGuidance(input), {
      headers: noStore,
    });
  } catch (error) {
    const status =
      error instanceof GuidanceDispatcherError && error.code === 'invalid_input'
        ? 400
        : error instanceof GuidanceDispatcherError &&
            error.code === 'not_configured'
          ? 503
          : 502;
    const message =
      error instanceof GuidanceDispatcherError
        ? error.message
        : 'Unable to generate guidance.';
    return NextResponse.json({ error: message }, { headers: noStore, status });
  }
}
