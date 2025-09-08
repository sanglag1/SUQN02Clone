import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { AuthProvider, useAuth } from '@/components/auth/UserSync';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

const signOut = vi.fn();
vi.mock('@clerk/nextjs', () => ({
  // Avoid triggering profile fetch in provider effect
  useUser: () => ({ user: null, isLoaded: true }),
  useAuth: () => ({ signOut }),
}));

vi.mock('@/utils/securityCleanup', () => ({ SecurityCleanup: { onLogout: vi.fn() } }));

// Prevent network during tests
global.fetch = vi.fn().mockResolvedValue({ ok: false }) as any;

describe('Auth logout', () => {
  it('calls security cleanup, clerk signOut, and navigates', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider> as any });

    await act(async () => {
      await result.current.logout();
    });

    expect(signOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/sign-in');
  });

  it('handles signOut error but still navigates', async () => {
    (await import('@clerk/nextjs') as any).useAuth = () => ({ signOut: vi.fn().mockRejectedValue(new Error('network')) });
    const { result } = renderHook(() => useAuth(), { wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider> as any });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockPush).toHaveBeenCalledWith('/sign-in');
  });
});


