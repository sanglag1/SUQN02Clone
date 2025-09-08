import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserPackageService, PackageLimitInfo, PackageCheckResponse } from '@/services/userPackage';

// Mock fetch globally
global.fetch = vi.fn();

describe('UserPackageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkActivePackage', () => {
    it('should return package limit info for active package', async () => {
      const mockResponse: PackageCheckResponse = {
        hasActivePackage: true,
        usage: {
          avatarInterview: {
            canUse: true,
            currentUsage: 5,
            serviceLimit: 10
          }
        },
        selectedPackage: {
          name: 'Premium Package'
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await UserPackageService.checkActivePackage();

      expect(result).toEqual({
        hasActivePackage: true,
        avatarInterviewCanUse: true,
        currentUsage: 5,
        totalLimit: 10,
        packageName: 'Premium Package'
      });

      expect(fetch).toHaveBeenCalledWith('/api/user-package/check-active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });

    it('should return package limit info for inactive package', async () => {
      const mockResponse: PackageCheckResponse = {
        hasActivePackage: false,
        usage: {
          avatarInterview: {
            canUse: false,
            currentUsage: 0,
            serviceLimit: 0
          }
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await UserPackageService.checkActivePackage();

      expect(result).toEqual({
        hasActivePackage: false,
        avatarInterviewCanUse: false,
        currentUsage: 0,
        totalLimit: 0,
        packageName: 'Unknown Package'
      });
    });

    it('should handle HTTP error responses', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(UserPackageService.checkActivePackage()).rejects.toThrow('HTTP error! status: 500');
    });

    it('should handle invalid response structure - missing hasActivePackage', async () => {
      const invalidResponse = {
        usage: {
          avatarInterview: {
            canUse: true,
            currentUsage: 5,
            serviceLimit: 10
          }
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse
      });

      await expect(UserPackageService.checkActivePackage()).rejects.toThrow('Invalid response structure from package check API');
    });

    it('should handle invalid response structure - missing avatarInterview usage', async () => {
      const invalidResponse = {
        hasActivePackage: true,
        usage: {}
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse
      });

      await expect(UserPackageService.checkActivePackage()).rejects.toThrow('Missing avatarInterview usage data in package check response');
    });

    it('should handle invalid avatarInterview usage data format', async () => {
      const invalidResponse = {
        hasActivePackage: true,
        usage: {
          avatarInterview: {
            canUse: true,
            currentUsage: 'invalid', // Should be number
            serviceLimit: 'invalid'  // Should be number
          }
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse
      });

      await expect(UserPackageService.checkActivePackage()).rejects.toThrow('Invalid avatarInterview usage data format');
    });

    it('should handle network errors', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(UserPackageService.checkActivePackage()).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      await expect(UserPackageService.checkActivePackage()).rejects.toThrow('Invalid JSON');
    });

    it('should handle null response', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => null
      });

      await expect(UserPackageService.checkActivePackage()).rejects.toThrow('Invalid response structure from package check API');
    });

    it('should handle undefined response', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => undefined
      });

      await expect(UserPackageService.checkActivePackage()).rejects.toThrow('Invalid response structure from package check API');
    });

    it('should handle package with zero limits', async () => {
      const mockResponse: PackageCheckResponse = {
        hasActivePackage: true,
        usage: {
          avatarInterview: {
            canUse: false,
            currentUsage: 0,
            serviceLimit: 0
          }
        },
        selectedPackage: {
          name: 'Free Package'
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await UserPackageService.checkActivePackage();

      expect(result).toEqual({
        hasActivePackage: true,
        avatarInterviewCanUse: false,
        currentUsage: 0,
        totalLimit: 0,
        packageName: 'Free Package'
      });
    });

    it('should handle package with maximum usage', async () => {
      const mockResponse: PackageCheckResponse = {
        hasActivePackage: true,
        usage: {
          avatarInterview: {
            canUse: false,
            currentUsage: 10,
            serviceLimit: 10
          }
        },
        selectedPackage: {
          name: 'Standard Package'
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await UserPackageService.checkActivePackage();

      expect(result).toEqual({
        hasActivePackage: true,
        avatarInterviewCanUse: false,
        currentUsage: 10,
        totalLimit: 10,
        packageName: 'Standard Package'
      });
    });
  });
});

