import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock storage
class MockStorage {
  store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  key(i: number) { return Object.keys(this.store)[i] ?? null; }
  getItem(k: string) { return this.store[k] ?? null; }
  setItem(k: string, v: string) { this.store[k] = String(v); (this as any)[k] = String(v); }
  removeItem(k: string) { delete this.store[k]; delete (this as any)[k]; }
  clear() { for (const k of Object.keys(this.store)) { this.removeItem(k); } }
}

const originalWindow = global.window;

describe('SecurityCleanup', () => {
  let local: MockStorage;
  let session: MockStorage;

  beforeEach(async () => {
    vi.resetModules();
    local = new MockStorage();
    session = new MockStorage();
    (global as any).localStorage = local as any;
    (global as any).sessionStorage = session as any;
    (global as any).window = { dispatchEvent: vi.fn(), addEventListener: vi.fn() } as any;
  });

  afterEach(() => {
    (global as any).window = originalWindow;
    vi.restoreAllMocks();
  });

  it('cleanupUserData removes sensitive keys and patterns', async () => {
    local.setItem('user', 'x');
    local.setItem('token', 'y');
    local.setItem('userSync_123', '1');
    local.setItem('profile', 'p');
    local.setItem('some_clerkId_cache', 'c');
    session.setItem('user_role_session', '1');

    const { SecurityCleanup } = await import('../../utils/securityCleanup');
    SecurityCleanup.cleanupUserData();

    expect(local.getItem('user')).toBeNull();
    expect(local.getItem('token')).toBeNull();
    expect(local.getItem('userSync_123')).toBeNull();
    expect(local.getItem('some_clerkId_cache')).toBeNull();
    expect(session.getItem('user_role_session')).toBeNull();
    // Unrelated key remains
    expect(local.getItem('profile')).toBe('p');
  });

  it('cleanupAuthTokens removes only auth related items', async () => {
    local.setItem('user', 'x');
    local.setItem('token', 'y');
    local.setItem('session', 's');
    local.setItem('keep', 'k');

    const { SecurityCleanup } = await import('../../utils/securityCleanup');
    SecurityCleanup.cleanupAuthTokens();

    expect(local.getItem('user')).toBeNull();
    expect(local.getItem('token')).toBeNull();
    expect(local.getItem('session')).toBeNull();
    expect(local.getItem('keep')).toBe('k');
  });

  it('auditLocalStorage detects sensitive keys', async () => {
    local.setItem('profile', 'p');
    local.setItem('authToken', 'a');
    local.setItem('CustomUserId', 'u');

    const { SecurityCleanup } = await import('../../utils/securityCleanup');
    const audit = SecurityCleanup.auditLocalStorage();

    expect(audit.hasUserData).toBe(true);
    // Should include at least keys containing user/token/session/clerk patterns
    expect(audit.sensitiveKeys).toEqual(expect.arrayContaining(['CustomUserId']));
    expect(audit.sensitiveKeys).not.toContain('profile');
  });

  it('onLogout triggers cleanup and dispatches event', async () => {
    local.setItem('user', 'x');
    const { SecurityCleanup } = await import('../../utils/securityCleanup');

    SecurityCleanup.onLogout();

    expect(local.getItem('user')).toBeNull();
    expect((window.dispatchEvent as any)).toHaveBeenCalled();
  });
});
