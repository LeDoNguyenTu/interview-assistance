import { NextResponse } from 'next/server';

import { asProviderCredentialSql } from '../../../../../data/provider-credentials/repository';
import { resolveProviderRuntimeEnvironment } from '../../../../../data/provider-credentials/runtime';
import {
  asSessionSql,
  getSessionForOwner,
} from '../../../../../data/sessions/repository';
import { getAuthenticatedUser } from '../../../../../lib/auth/neon-auth';
import { getNeonSql } from '../../../../../lib/neon/database';
import {
  transcribeAudio,
  TranscriptionDispatcherError,
} from '../../../../../lib/transcription/dispatcher';

const noStore = { 'Cache-Control': 'no-store' };
const maximumAudioBytes = 8 * 1024 * 1024;
const supportedAudioTypes = new Set([
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
]);
type RouteContext = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const claims = await getAuthenticatedUser();
  if (!claims) {
    return NextResponse.json(
      { error: 'Sign in to transcribe session audio.' },
      { headers: noStore, status: 401 },
    );
  }

  try {
    const form = await request.formData();
    const audio = form.get('audio');
    const baseAudioType =
      audio instanceof File ? audio.type.split(';', 1)[0] : undefined;
    if (
      !(audio instanceof File) ||
      !baseAudioType ||
      !supportedAudioTypes.has(baseAudioType) ||
      audio.size < 1 ||
      audio.size > maximumAudioBytes
    ) {
      return NextResponse.json(
        { error: 'Upload a supported audio segment under 8 MB.' },
        { headers: noStore, status: 400 },
      );
    }

    const { sessionId } = await context.params;
    const sql = getNeonSql();
    const session = await getSessionForOwner(
      asSessionSql(sql),
      claims,
      sessionId,
    );
    if (!session) {
      return NextResponse.json(
        { error: 'The session is not available.' },
        { headers: noStore, status: 404 },
      );
    }
    if (!session.consentedAt || session.captureSources.length === 0) {
      return NextResponse.json(
        { error: 'Record participant consent before transcription.' },
        { headers: noStore, status: 409 },
      );
    }
    if (session.providerId === 'fixture') {
      return NextResponse.json(
        { error: 'Choose OpenAI or Gemini for live transcription.' },
        { headers: noStore, status: 400 },
      );
    }

    const environment = await resolveProviderRuntimeEnvironment(
      asProviderCredentialSql(sql),
      claims,
      session.providerId,
      process.env,
    );
    const result = await transcribeAudio(
      {
        audio: new Uint8Array(await audio.arrayBuffer()),
        mimeType: audio.type,
        provider: session.providerId,
      },
      { env: environment, fetchImpl: fetch },
    );
    return NextResponse.json(result, { headers: noStore });
  } catch (error) {
    const status =
      error instanceof TranscriptionDispatcherError &&
      error.code === 'not_configured'
        ? 503
        : 502;
    const message =
      error instanceof TranscriptionDispatcherError
        ? error.message
        : 'Unable to transcribe this audio segment.';
    return NextResponse.json({ error: message }, { headers: noStore, status });
  }
}
