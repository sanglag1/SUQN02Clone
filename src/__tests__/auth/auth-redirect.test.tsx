// @ts-nocheck
import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import AuthRedirect from '@/components/auth/AuthRedirect';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }), usePathname: () => '/sign-in' }));

describe('AuthRedirect', () => {
  beforeEach(() => vi.resetModules());

  it('redirects signed-in users away from auth pages', async () => {
    vi.doMock('@clerk/nextjs', () => ({ useUser: () => ({ isSignedIn: true, isLoaded: true }) }));
    const Comp = (await import('@/components/auth/AuthRedirect')).default;
    render(<Comp />);
    expect(replace).toHaveBeenCalledWith('/dashboard');
  });

  it('does nothing when not signed in', async () => {
    replace.mockClear();
    vi.doMock('@clerk/nextjs', () => ({ useUser: () => ({ isSignedIn: false, isLoaded: true }) }));
    const Comp = (await import('@/components/auth/AuthRedirect')).default;
    render(<Comp />);
    expect(replace).not.toHaveBeenCalled();
  });
});


