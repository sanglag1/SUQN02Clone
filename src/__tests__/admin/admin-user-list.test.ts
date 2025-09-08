// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as GET_USERS } from '@/app/api/user/route';
import { POST as CLEAR_CACHE } from '@/app/api/user/clear-cache/route';
import prisma from '@/lib/prisma';
import * as userCache from '@/lib/userCache';

vi.mock('@/lib/prisma', () => {
  const findMany = vi.fn();
  return { default: { user: { findMany } }, prisma: { user: { findMany } } };
});

describe('Admin View User List & Refresh Cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // reset cache helpers
    (userCache as any).invalidateUserListCache();
  });

  it('returns users with cache miss then sets cache', async () => {
    const users = [{ id: 'u1', clerkId: 'ck_1', email: 'a@b.com', role: { name: 'user' } }];
    (prisma as any).user.findMany.mockResolvedValue(users);

    const res = await GET_USERS();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.users.length).toBe(1);
  });

  it('refreshes cache via POST /api/user/clear-cache', async () => {
    const res = await CLEAR_CACHE();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toMatch(/User list cache cleared/i);
  });
});
