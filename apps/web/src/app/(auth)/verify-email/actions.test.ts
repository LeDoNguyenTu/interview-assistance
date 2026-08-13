import { beforeEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  redirect: vi.fn(),
  sendVerificationOtp: vi.fn(),
  signUpEmail: vi.fn(),
  verifyEmail: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({ redirect: dependencies.redirect }));
vi.mock('../../../lib/auth/neon-auth.js', () => ({
  getNeonAuth: vi.fn().mockReturnValue({
    emailOtp: {
      sendVerificationOtp: dependencies.sendVerificationOtp,
      verifyEmail: dependencies.verifyEmail,
    },
    signUp: { email: dependencies.signUpEmail },
  }),
}));

import { signUp } from '../sign-in/actions.js';
import { resendVerificationCode, verifyEmailCode } from './actions.js';

const idleState = { message: null, status: 'idle' as const };

function formData(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe('email verification actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.signUpEmail.mockResolvedValue({ data: {}, error: null });
    dependencies.verifyEmail.mockResolvedValue({ data: {}, error: null });
    dependencies.sendVerificationOtp.mockResolvedValue({
      data: { success: true },
      error: null,
    });
  });

  it('continues a successful registration on the verification route', async () => {
    await signUp(
      idleState,
      formData({ email: ' Person@Example.com ', password: 'password123' }),
    );

    expect(dependencies.redirect).toHaveBeenCalledWith(
      '/verify-email?email=person%40example.com',
    );
  });

  it('rejects a malformed verification code before calling Neon Auth', async () => {
    await expect(
      verifyEmailCode(
        idleState,
        formData({ email: 'person@example.com', otp: '12a' }),
      ),
    ).resolves.toEqual({
      message: 'Enter the six-digit code from your email.',
      status: 'error',
    });
    expect(dependencies.verifyEmail).not.toHaveBeenCalled();
  });

  it('verifies a valid code and redirects to sign-in confirmation', async () => {
    await verifyEmailCode(
      idleState,
      formData({ email: 'Person@Example.com', otp: '123456' }),
    );

    expect(dependencies.verifyEmail).toHaveBeenCalledWith({
      email: 'person@example.com',
      otp: '123456',
    });
    expect(dependencies.redirect).toHaveBeenCalledWith('/sign-in?verified=1');
  });

  it('keeps verification failures generic and does not redirect', async () => {
    dependencies.verifyEmail.mockResolvedValueOnce({
      data: null,
      error: { code: 'INVALID_OTP' },
    });

    await expect(
      verifyEmailCode(
        idleState,
        formData({ email: 'person@example.com', otp: '654321' }),
      ),
    ).resolves.toEqual({
      message:
        'That code could not be verified. Request a new code and try again.',
      status: 'error',
    });
    expect(dependencies.redirect).not.toHaveBeenCalled();
  });

  it('resends an email-verification code through Neon Auth', async () => {
    await expect(
      resendVerificationCode(
        idleState,
        formData({ email: 'person@example.com' }),
      ),
    ).resolves.toEqual({
      message: 'A new code is on its way. Check your inbox.',
      status: 'success',
    });

    expect(dependencies.sendVerificationOtp).toHaveBeenCalledWith({
      email: 'person@example.com',
      type: 'email-verification',
    });
  });

  it('reports a generic resend failure without exposing account state', async () => {
    dependencies.sendVerificationOtp.mockResolvedValueOnce({
      data: null,
      error: { code: 'RATE_LIMITED' },
    });

    await expect(
      resendVerificationCode(
        idleState,
        formData({ email: 'person@example.com' }),
      ),
    ).resolves.toEqual({
      message: 'A new code could not be sent yet. Please try again shortly.',
      status: 'error',
    });
  });
});
