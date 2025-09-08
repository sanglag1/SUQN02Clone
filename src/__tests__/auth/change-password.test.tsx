// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import SignInPage from '@/app/(auth)/sign-in/[[...sign-in]]/page';

const mockRouterReplace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockRouterReplace }) }));

const setActive = vi.fn();
const create = vi.fn();
const attemptFirstFactor = vi.fn();
const resetPassword = vi.fn();

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: null, isSignedIn: false, isLoaded: true }),
  useSignIn: () => ({
    signIn: { create, attemptFirstFactor, resetPassword, authenticateWithRedirect: vi.fn() },
    setActive,
    isLoaded: true,
  }),
}));

describe('Forgot/Change Password flow', () => {
  it('completes reset with code and new password', async () => {
    create.mockResolvedValueOnce({});
    attemptFirstFactor.mockResolvedValueOnce({ status: 'needs_new_password' });
    resetPassword.mockResolvedValueOnce({ status: 'complete', createdSessionId: 'sess_2' });

    render(<SignInPage />);

    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));
    fireEvent.change(screen.getByLabelText(/^email address$/i), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

    await waitFor(() => expect(create).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'newPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(attemptFirstFactor).toHaveBeenCalledWith({ strategy: 'reset_password_email_code', code: '123456' });
      expect(resetPassword).toHaveBeenCalledWith({ password: 'newPass123!' });
      expect(setActive).toHaveBeenCalledWith({ session: 'sess_2' });
      expect(mockRouterReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error when code invalid/expired', async () => {
    create.mockResolvedValueOnce({});
    attemptFirstFactor.mockRejectedValueOnce(new Error('incorrect code'));

    render(<SignInPage />);
    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));
    fireEvent.change(screen.getByLabelText(/^email address$/i), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));
    await waitFor(() => expect(create).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '000000' } });
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to reset password|incorrect code|expired/i)).toBeInTheDocument();
    });
  });
});


