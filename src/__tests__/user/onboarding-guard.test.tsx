/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

describe('OnboardingGuard', () => {
  beforeEach(() => {
    vi.resetModules();
    push.mockReset();
    // default pathname not onboarding
    Object.defineProperty(window, 'location', { value: { pathname: '/' }, writable: true });
  });

  it('renders children when signed in and no onboarding needed', async () => {
    vi.doMock('@clerk/nextjs', () => ({ useAuth: () => ({ isSignedIn: true, isLoaded: true }) }));
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ needsOnboarding: false }) }) as any;

    const Comp = (await import('@/components/OnboardingGuard')).default;
    render(<Comp><div data-testid="content">ok</div></Comp>);
    await waitFor(() => expect(screen.getByTestId('content')).toBeInTheDocument());
    expect(push).not.toHaveBeenCalled();
  });

  it('redirects to /onboarding when needed', async () => {
    vi.doMock('@clerk/nextjs', () => ({ useAuth: () => ({ isSignedIn: true, isLoaded: true }) }));
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ needsOnboarding: true }) }) as any;

    const Comp = (await import('@/components/OnboardingGuard')).default;
    render(<Comp><div>hidden</div></Comp>);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/onboarding'));
  });

  it('shows spinner while loading', async () => {
    vi.doMock('@clerk/nextjs', () => ({ useAuth: () => ({ isSignedIn: true, isLoaded: false }) }));
    const Comp = (await import('@/components/OnboardingGuard')).default;
    render(<Comp><div>hidden</div></Comp>);
    expect(screen.getByText(/Checking.../i)).toBeInTheDocument();
  });
});


