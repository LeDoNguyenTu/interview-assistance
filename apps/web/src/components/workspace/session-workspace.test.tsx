// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach } from 'vitest';
import { describe, expect, it, vi } from 'vitest';

import type { SessionRecord } from '@candorlens/core';
import { SessionWorkspace } from './session-workspace';

afterEach(cleanup);

const session: SessionRecord = {
  id: 'session-1',
  ownerId: 'owner-1',
  title: 'Product interview',
  mode: 'interviewer',
  status: 'draft',
  providerId: 'fixture',
  captureSources: [],
  consentedAt: null,
  startedAt: null,
  endedAt: null,
  createdAt: '2026-08-12T00:00:00.000Z',
  updatedAt: '2026-08-12T00:00:00.000Z',
};

describe('SessionWorkspace', () => {
  it('requires consent before starting the visible fixture session', () => {
    render(<SessionWorkspace session={session} />);
    const start = screen.getByRole('button', { name: 'Start fixture session' });

    expect(start).toHaveProperty('disabled', true);
    fireEvent.click(
      screen.getByRole('checkbox', { name: /consent has been obtained/i }),
    );
    expect(start).toHaveProperty('disabled', false);
    fireEvent.click(start);
    expect(screen.getByText(/Tell me about a decision/i)).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Capturing');
  });

  it('adds a facilitator note', () => {
    render(<SessionWorkspace session={session} />);
    fireEvent.change(screen.getByLabelText('Facilitator note'), {
      target: { value: 'Follow up on scope.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add note' }));
    expect(screen.getByText('Follow up on scope.')).toBeTruthy();
  });

  it('sends visible transcript context only when guidance is requested', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          provider: 'openai',
          text: 'Draft guidance for human review.',
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchImpl);
    render(<SessionWorkspace session={session} />);

    expect(fetchImpl).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('checkbox', { name: /consent has been obtained/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Start fixture session' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Generate guidance' }));

    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Draft guidance for human review.')).toBeTruthy();
    expect(screen.getByText(/Draft for human review/i)).toBeTruthy();
  });
});
