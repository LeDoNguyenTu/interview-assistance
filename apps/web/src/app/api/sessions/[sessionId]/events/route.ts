import { NextResponse } from 'next/server';

import {
  LiveSessionEventInputError,
  parseLiveSessionEvent,
} from '../../../../../data/live-session/input';
import {
  asLiveSessionSql,
  hasSessionConsent,
  saveDetectedQuestion,
  saveFinalUtterance,
  saveSessionNote,
  saveSessionConsent,
} from '../../../../../data/live-session/repository';
import { getAuthenticatedUser } from '../../../../../lib/auth/neon-auth';
import { getNeonSql } from '../../../../../lib/neon/database';
import { isLikelyInterviewQuestion } from '../../../../../features/live-session/question-detection';

const noStore = { 'Cache-Control': 'no-store' };
type RouteContext = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const claims = await getAuthenticatedUser();
  if (!claims) {
    return NextResponse.json(
      { error: 'Sign in to save session events.' },
      { headers: noStore, status: 401 },
    );
  }

  try {
    const event = parseLiveSessionEvent(await request.json());
    const { sessionId } = await context.params;
    const sql = asLiveSessionSql(getNeonSql());

    if (event.type !== 'consent') {
      const consented = await hasSessionConsent(sql, claims, sessionId);
      if (!consented) {
        return NextResponse.json(
          { error: 'Record participant consent before saving capture events.' },
          { headers: noStore, status: 409 },
        );
      }
    }

    if (event.type === 'consent') {
      const saved = await saveSessionConsent(
        sql,
        claims,
        sessionId,
        event.sources,
      );
      if (!saved) {
        return NextResponse.json(
          { error: 'The session is not available.' },
          { headers: noStore, status: 404 },
        );
      }
    } else if (event.type === 'note') {
      const saved = await saveSessionNote(sql, claims, sessionId, {
        body: event.body,
        idempotencyKey: event.idempotencyKey,
      });
      if (!saved) {
        return NextResponse.json(
          { error: 'The session is not available.' },
          { headers: noStore, status: 404 },
        );
      }
    } else {
      const saved = await saveFinalUtterance(sql, claims, sessionId, event);
      if (!saved) {
        return NextResponse.json(
          { error: 'The session is not available.' },
          { headers: noStore, status: 404 },
        );
      }

      if (
        event.speaker === 'interviewer' &&
        isLikelyInterviewQuestion(event.text)
      ) {
        await saveDetectedQuestion(sql, claims, sessionId, {
          confidence: event.confidence,
          sourceUtteranceId: event.id,
          text: event.text,
        });
      }
    }

    return NextResponse.json(
      { saved: true },
      { headers: noStore, status: 201 },
    );
  } catch (error) {
    const invalidInput =
      error instanceof LiveSessionEventInputError ||
      error instanceof SyntaxError;
    return NextResponse.json(
      {
        error: invalidInput
          ? 'Enter a valid live session event.'
          : 'Unable to save the live session event.',
      },
      { headers: noStore, status: invalidInput ? 400 : 500 },
    );
  }
}
