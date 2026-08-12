'use server';

import { redirect } from 'next/navigation';

import {
  SessionInputError,
  asSessionSql,
  createDraftSession,
} from '../../../../data/sessions/repository';
import { requireUser } from '../../../../lib/auth/require-user-server';
import { getNeonSql } from '../../../../lib/neon/database';
import type { SessionFormState } from '../../../../components/sessions/session-form';

export async function createSession(
  _: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const claims = await requireUser();
  const title = formData.get('title');
  const mode = formData.get('mode');
  let sessionId: string;

  try {
    const session = await createDraftSession(
      asSessionSql(getNeonSql()),
      claims,
      {
        mode,
        providerId: 'fixture',
        title,
      },
    );
    sessionId = session.id;
  } catch (error) {
    if (error instanceof SessionInputError) {
      return { message: error.message, status: 'error' };
    }

    return {
      message: 'We could not create this draft. Please try again.',
      status: 'error',
    };
  }

  redirect(`/sessions/${sessionId}`);
}
