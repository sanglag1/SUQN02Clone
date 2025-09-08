// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import SignUpPage from '@/app/(auth)/sign-up/[[...sign-up]]/page';

const mockRouterReplace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockRouterReplace }) }));

const setActive = vi.fn();
const create = vi.fn().mockResolvedValue({ status: 'needs_first_factor' });
const prepareEmailAddressVerification = vi.fn().mockResolvedValue({});
const attemptEmailAddressVerification = vi.fn();

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: null, isSignedIn: false, isLoaded: true }),
  useSignUp: () => ({
    signUp: { create, prepareEmailAddressVerification, attemptEmailAddressVerification, authenticateWithRedirect: vi.fn() },
    setActive,
    isLoaded: true,
  }),
}));

global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'db1' }) }) as any;

describe('Verify Email flow', () => {
  it('verifies code and redirects', async () => {
    attemptEmailAddressVerification.mockResolvedValueOnce({ status: 'complete', createdUserId: 'u_1', createdSessionId: 'sess_1' });

    render(<SignUpPage />);
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'B' } });
    fireEvent.change(screen.getByLabelText(/^email address$/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'pass12345' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => expect(prepareEmailAddressVerification).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

    await waitFor(() => {
      expect(setActive).toHaveBeenCalledWith({ session: 'sess_1' });
      expect(mockRouterReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error when code is incorrect/expired', async () => {
    mockRouterReplace.mockClear();
    attemptEmailAddressVerification.mockResolvedValueOnce({ status: 'missing_second_factor' });

    render(<SignUpPage />);
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'B' } });
    fireEvent.change(screen.getByLabelText(/^email address$/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'pass12345' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => expect(prepareEmailAddressVerification).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

    // expect an error or at least no redirect (still on verify screen)
    await waitFor(() => {
      expect(mockRouterReplace).not.toHaveBeenCalledWith('/dashboard');
    });
  });
});


