export interface PackageLimitInfo {
  hasActivePackage: boolean;
  avatarInterviewCanUse: boolean;
  currentUsage: number;
  totalLimit: number;
  packageName: string;
}

export interface PackageCheckResponse {
  hasActivePackage: boolean;
  usage: {
    avatarInterview: {
      canUse: boolean;
      currentUsage: number;
      serviceLimit: number;
    };
  };
  selectedPackage?: {
    name: string;
  };
}

export class UserPackageService {
  static async checkActivePackage(): Promise<PackageLimitInfo> {
    try {
      const res = await fetch('/api/user-package/check-active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data: PackageCheckResponse = await res.json();
      
      // Validate response structure
      if (!data || typeof data.hasActivePackage !== 'boolean') {
        throw new Error('Invalid response structure from package check API');
      }
      
      if (!data.usage?.avatarInterview) {
        throw new Error('Missing avatarInterview usage data in package check response');
      }
      
      const { avatarInterview } = data.usage;
      
      if (typeof avatarInterview.currentUsage !== 'number' || 
          typeof avatarInterview.serviceLimit !== 'number') {
        throw new Error('Invalid avatarInterview usage data format');
      }
      
      return {
        hasActivePackage: data.hasActivePackage,
        avatarInterviewCanUse: avatarInterview.canUse,
        currentUsage: avatarInterview.currentUsage,
        totalLimit: avatarInterview.serviceLimit,
        packageName: data.selectedPackage?.name || 'Unknown Package'
      };
      
    } catch (error) {
      console.error('Error checking package limits:', error);
      throw error;
    }
  }
}

