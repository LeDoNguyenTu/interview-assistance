// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthForm } from './auth-form.js';

afterEach(cleanup);

describe('AuthForm', () => {
  it('uses high-contrast fields and labels on its dark authentication surface', () => {
    render(
      <AuthForm
        action={async () => ({ message: null, status: 'idle' as const })}
        mode="sign-in"
      />,
    );

    expect(screen.getByLabelText('Email address').className).toContain(
      'text-white',
    );
    expect(screen.getByLabelText('Password').className).toContain('text-white');
  });
});
