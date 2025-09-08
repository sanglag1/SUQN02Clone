// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import SignUpPage from '@/app/(auth)/sign-up/[[...sign-up]]/page';

const mockRouterReplace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockRouterReplace }) }));

const setActive = vi.fn();
const create = vi.fn();
const prepareEmailAddressVerification = vi.fn();
const attemptEmailAddressVerification = vi.fn();
const oauthSpy = vi.fn();

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: null, isSignedIn: false, isLoaded: true }),
  useSignUp: () => ({
    signUp: { create, prepareEmailAddressVerification, attemptEmailAddressVerification, authenticateWithRedirect: oauthSpy },
    setActive,
    isLoaded: true,
  }),
}));

// Mock fetch for saving user
global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'db1' }) }) as any;

describe('SignUpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes sign up immediately and redirects', async () => {
    create.mockResolvedValueOnce({ status: 'complete', createdUserId: 'u_1', createdSessionId: 'sess_1' });

    render(<SignUpPage />);
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'B' } });
    fireEvent.change(screen.getByLabelText(/^email address$/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'pass12345' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(setActive).toHaveBeenCalledWith({ session: 'sess_1' });
      expect(mockRouterReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('requires email verification when not complete', async () => {
    create.mockResolvedValueOnce({ status: 'needs_first_factor' });
    prepareEmailAddressVerification.mockResolvedValueOnce({});

    render(<SignUpPage />);
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'B' } });
    fireEvent.change(screen.getByLabelText(/^email address$/i), { target: { value: 'v@e.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'pass12345' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => expect(prepareEmailAddressVerification).toHaveBeenCalled());
    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
  });

  it('calls Google OAuth on click', async () => {
    render(<SignUpPage />);
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    await waitFor(() => expect(oauthSpy).toHaveBeenCalled());
  });
});


