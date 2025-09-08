// @ts-nocheck
import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock('@/context/RoleContext', () => ({
  useRole: () => ({ isAdmin: false, loading: false, role: 'user', refreshRole: vi.fn() }),
}));

describe('AdminRouteGuard', () => {
  beforeEach(() => vi.resetModules());

  it('renders children when admin', async () => {
    vi.doMock('@/context/RoleContext', () => ({ useRole: () => ({ isAdmin: true, loading: false, role: 'admin', refreshRole: vi.fn() }) }));
    const Guard = (await import('@/components/auth/AdminRouteGuard')).default;
    render(<Guard><div data-testid="secret">secret</div></Guard>);
    expect(screen.getByTestId('secret')).toBeInTheDocument();
  });

  it('shows fallback when not admin', async () => {
    // role is not admin; ensure no loading state blocks rendering
    vi.doMock('@/context/RoleContext', () => ({ useRole: () => ({ isAdmin: false, loading: false, role: 'user', refreshRole: vi.fn() }) }));
    const Guard = (await import('@/components/auth/AdminRouteGuard')).default;
    render(<Guard fallback={<div data-testid="denied" />}>hidden</Guard>);
    expect(screen.getByTestId('denied')).toBeInTheDocument();
  });
});


