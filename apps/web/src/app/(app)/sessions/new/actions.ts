'use server';

import { redirect } from 'next/navigation';

import {
  SessionInputError,
  asSessionSql,
  createDraftSession,
} from '../../../../data/sessions/repository';
import {
  asProviderCredentialSql,
  listProviderCredentialSummaries,
} from '../../../../data/provider-credentials/repository';
import { requireUser } from '../../../../lib/auth/require-user-server';
import { getNeonSql } from '../../../../lib/neon/database';
import {
  getEnabledProviderIds,
  getProviderAvailability,
} from '../../../../config/providers';
import type { SessionFormState } from '../../../../components/sessions/session-form';

export async function createSession(
  _: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const claims = await requireUser();
  const title = formData.get('title');
  const mode = formData.get('mode');
  const providerId = formData.get('provider');
  let sessionId: string;

  try {
    const sql = getNeonSql();
    const credentials = await listProviderCredentialSummaries(
      asProviderCredentialSql(sql),
      claims,
    );
    const session = await createDraftSession(
      asSessionSql(sql),
      claims,
      {
        mode,
        providerId,
        title,
      },
      getEnabledProviderIds(
        getProviderAvailability(
          process.env,
          credentials.map((credential) => credential.provider),
        ),
      ),
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
