// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach } from 'vitest';
import { describe, expect, it } from 'vitest';

import type { SessionRecord } from '@candorlens/core';
import { SessionWorkspace } from './session-workspace';

afterEach(cleanup);

const session: SessionRecord = {
  id: 'session-1', ownerId: 'owner-1', title: 'Product interview', mode: 'interviewer',
  status: 'draft', providerId: 'fixture', captureSources: [], consentedAt: null,
  startedAt: null, endedAt: null, createdAt: '2026-08-12T00:00:00.000Z', updatedAt: '2026-08-12T00:00:00.000Z',
};

describe('SessionWorkspace', () => {
  it('requires consent before starting the visible fixture session', () => {
    render(<SessionWorkspace session={session} />);
    const start = screen.getByRole('button', { name: 'Start fixture session' });

    expect(start).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByRole('checkbox', { name: /consent has been obtained/i }));
    expect(start).toHaveProperty('disabled', false);
    fireEvent.click(start);
    expect(screen.getByText(/Tell me about a decision/i)).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Capturing');
  });

  it('adds a facilitator note', () => {
    render(<SessionWorkspace session={session} />);
    fireEvent.change(screen.getByLabelText('Facilitator note'), { target: { value: 'Follow up on scope.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add note' }));
    expect(screen.getByText('Follow up on scope.')).toBeTruthy();
  });
});
