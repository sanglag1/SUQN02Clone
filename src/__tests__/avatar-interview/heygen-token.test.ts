import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('HeyGen Token API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      HEYGEN_API_KEY: 'test-api-key',
      NEXT_PUBLIC_BASE_API_URL: 'https://api.heygen.com'
    };
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it('should return token successfully', async () => {
    const mockResponse = { data: { token: 'test-token-123' } };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const { POST } = await import('@/app/api/heygen-token/route');
    const response = await POST();
    const data = await response.text();

    expect(response.status).toBe(200);
    expect(data).toBe('test-token-123');
  });

  it('should return 500 when API key missing', async () => {
    // Temporarily unset the API key for this test
    delete process.env.HEYGEN_API_KEY;
    
    // Clear module cache to ensure fresh import
    vi.resetModules();

    const { POST } = await import('@/app/api/heygen-token/route');
    const response = await POST();
    const data = await response.text();

    expect(response.status).toBe(500);
    expect(data).toBe('API key configuration error');
  });

  it('should return 500 when HeyGen API fails', async () => {
    // Ensure API key is set for this test
    process.env.HEYGEN_API_KEY = 'test-api-key';
    
    // Clear module cache to ensure fresh import with new env
    vi.resetModules();
    
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const { POST } = await import('@/app/api/heygen-token/route');
    const response = await POST();
    const data = await response.text();

    expect(response.status).toBe(500);
    expect(data).toBe('Failed to get token from HeyGen API');
  });
});
