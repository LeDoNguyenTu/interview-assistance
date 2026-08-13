import { NextResponse } from 'next/server';

import { asProviderCredentialSql } from '../../../data/provider-credentials/repository';
import { resolveProviderRuntimeEnvironment } from '../../../data/provider-credentials/runtime';
import { getAuthenticatedUser } from '../../../lib/auth/neon-auth';
import {
  GuidanceDispatcherError,
  generateGuidance,
  type GuidanceInput,
} from '../../../lib/guidance/dispatcher';
import { getNeonSql } from '../../../lib/neon/database';

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
    const environment = await resolveProviderRuntimeEnvironment(
      asProviderCredentialSql(getNeonSql()),
      claims,
      input.provider,
      process.env,
    );
    return NextResponse.json(
      await generateGuidance(input, { env: environment, fetchImpl: fetch }),
      {
        headers: noStore,
      },
    );
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
