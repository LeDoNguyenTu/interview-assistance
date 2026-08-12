'use server';

import { redirect } from 'next/navigation';

import {
  SessionInputError,
  createDraftSession,
  type SessionDatabaseClient,
} from '../../../../data/sessions/repository';
import { requireUser } from '../../../../lib/auth/require-user-server';
import { createClient } from '../../../../lib/supabase/server';
import type { SessionFormState } from '../../../../components/sessions/session-form';

export async function createSession(
  _: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const claims = await requireUser();
  const title = formData.get('title');
  const mode = formData.get('mode');

  try {
    const database = (await createClient()) as unknown as SessionDatabaseClient;
    const session = await createDraftSession(database, claims, {
      mode,
      providerId: 'fixture',
      title,
    });
    redirect(`/sessions/${session.id}`);
  } catch (error) {
    if (error instanceof SessionInputError) {
      return { message: error.message, status: 'error' };
    }

    return {
      message: 'We could not create this draft. Please try again.',
      status: 'error',
    };
  }
}
