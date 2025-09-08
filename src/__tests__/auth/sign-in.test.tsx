// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import SignInPage from '@/app/(auth)/sign-in/[[...sign-in]]/page';

vi.mock('@clerk/nextjs', () => {
  const setActive = vi.fn();
  const create = vi.fn();
  const authenticateWithRedirect = vi.fn();
  return {
    useUser: () => ({ user: null, isSignedIn: false, isLoaded: true }),
    useSignIn: () => ({ signIn: { create, authenticateWithRedirect }, setActive, isLoaded: true }),
  };
});

vi.mock('next/navigation', () => {
  const replace = vi.fn();
  return { useRouter: () => ({ replace }) };
});

describe('SignInPage', () => {
  it('submits email/password and redirects on success', async () => {
    const clerk = await import('@clerk/nextjs');
    const nav = await import('next/navigation');
    nav.useRouter = () => ({ replace: vi.fn() } as any);
    const setActive = vi.fn();
    const create = vi.fn().mockResolvedValue({ status: 'complete', createdSessionId: 'sess_1' });
    (clerk as any).useSignIn = () => ({ signIn: { create, authenticateWithRedirect: vi.fn() }, setActive, isLoaded: true });
    const replaceSpy = vi.spyOn((await import('next/navigation')) as any, 'useRouter').mockReturnValue({ replace: vi.fn() });

    render(<SignInPage />);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass12345' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in$/i }));

    await waitFor(() => {
      expect(setActive).toHaveBeenCalledWith({ session: 'sess_1' });
    });
    expect((replaceSpy.mock.results[0].value as any).replace).toBeDefined();
  });

  it('shows error on failure', async () => {
    const setActive = vi.fn();
    const create = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    (await import('@clerk/nextjs') as any).useSignIn = () => ({
      signIn: { create, authenticateWithRedirect: vi.fn() },
      setActive,
      isLoaded: true,
    });

    render(<SignInPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('starts forgot password flow (send code)', async () => {
    const create = vi.fn().mockResolvedValue({});
    (await import('@clerk/nextjs') as any).useSignIn = () => ({
      signIn: { create, authenticateWithRedirect: vi.fn() },
      setActive: vi.fn(),
      isLoaded: true,
    });

    render(<SignInPage />);
    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ strategy: 'reset_password_email_code', identifier: 'a@b.com' }));
  });

  it('calls Google OAuth on click', async () => {
    const authenticateWithRedirect = vi.fn();
    (await import('@clerk/nextjs') as any).useSignIn = () => ({
      signIn: { create: vi.fn(), authenticateWithRedirect },
      setActive: vi.fn(),
      isLoaded: true,
    });

    render(<SignInPage />);
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    await waitFor(() => expect(authenticateWithRedirect).toHaveBeenCalled());
  });
});


