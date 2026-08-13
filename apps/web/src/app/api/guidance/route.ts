import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';

import {
  asLiveSessionSql,
  saveGuidanceEvent,
} from '../../../data/live-session/repository';
import { asProviderCredentialSql } from '../../../data/provider-credentials/repository';
import { resolveProviderRuntimeEnvironment } from '../../../data/provider-credentials/runtime';
import {
  asSessionSql,
  getSessionForOwner,
} from '../../../data/sessions/repository';
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
    const sql = getNeonSql();
    const session = await getSessionForOwner(
      asSessionSql(sql),
      claims,
      input.sessionId,
    );
    if (!session) {
      return NextResponse.json(
        { error: 'The session is not available.' },
        { headers: noStore, status: 404 },
      );
    }
    const guidanceInput: GuidanceInput = {
      ...input,
      mode: session.mode,
      title: session.title,
    };
    const environment = await resolveProviderRuntimeEnvironment(
      asProviderCredentialSql(sql),
      claims,
      input.provider,
      process.env,
    );
    const result = await generateGuidance(guidanceInput, {
      env: environment,
      fetchImpl: fetch,
    });
    const idempotencyKey = createHash('sha256')
      .update(JSON.stringify(guidanceInput))
      .digest('hex');
    const saved = await saveGuidanceEvent(
      asLiveSessionSql(sql),
      claims,
      session.id,
      {
        idempotencyKey,
        provider: result.provider,
        text: result.text,
      },
    );
    if (!saved) throw new Error('Unable to save guidance.');

    return NextResponse.json(result, { headers: noStore });
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
