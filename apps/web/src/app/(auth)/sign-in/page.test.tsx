// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SignInErrorAlert } from './sign-in-error-alert.js';

afterEach(cleanup);

describe('SignInPage', () => {
  it('renders a generic accessible authentication failure alert', async () => {
    render(<SignInErrorAlert error="auth" />);

    expect(screen.getByRole('alert').textContent).toBe('We could not complete authentication. Please try again.');
  });
});
