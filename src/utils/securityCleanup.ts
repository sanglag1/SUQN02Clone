"use client";

/**
 * Utility để cleanup dữ liệu bảo mật khỏi localStorage
 * Sử dụng khi cần xóa toàn bộ dữ liệu nhạy cảm
 */
export class SecurityCleanup {
  
  /**
   * Xóa tất cả dữ liệu user/auth khỏi localStorage
   */
  static cleanupUserData() {
    const keysToRemove = [
      'user',
      'token', 
      'authToken',
      'syncedUserIds',
      'user_role_cache_v3', // Old role cache
      'user_role_cache',    // Any role cache variants
      // Pattern để xóa tất cả userSync_* keys
    ];

    // Xóa các keys cố định
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Xóa tất cả keys có pattern userSync_*
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith('userSync_') || 
          key.startsWith('user_') ||
          key.includes('clerkId') ||
          key.includes('userId') ||
          key.includes('role_cache')) {
        localStorage.removeItem(key);
      }
    });

    // Also clear sessionStorage role cache
      sessionStorage.removeItem('user_role_session');
    }

   

  /**
   * Xóa chỉ auth tokens
   */
  static cleanupAuthTokens() {
    const authKeys = ['user', 'token', 'authToken', 'session'];
    authKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Kiểm tra localStorage có chứa dữ liệu nhạy cảm không
   */
  static auditLocalStorage(): { hasUserData: boolean; sensitiveKeys: string[] } {
    const allKeys = Object.keys(localStorage);
    const sensitivePatterns = [
      'user', 'token', 'auth', 'session', 'clerk', 'userId', 'clerkId'
    ];

    const sensitiveKeys = allKeys.filter(key => 
      sensitivePatterns.some(pattern => 
        key.toLowerCase().includes(pattern.toLowerCase())
      )
    );

    return {
      hasUserData: sensitiveKeys.length > 0,
      sensitiveKeys
    };
  }

  /**
   * Chạy cleanup khi user logout
   */
  static onLogout() {
    this.cleanupUserData();
    
    // Thêm event để clear cache
    window.dispatchEvent(new CustomEvent('security-cleanup'));
  }

  /**
   * Chạy định kỳ để cleanup (optional)
   */
  static scheduleCleanup() {
    // Cleanup mỗi 30 phút
    setInterval(() => {
      const audit = this.auditLocalStorage();
      if (audit.hasUserData) {
        console.warn('⚠️ Detected user data in localStorage, cleaning up...', audit.sensitiveKeys);
        this.cleanupUserData();
      }
    }, 30 * 60 * 1000);
  }
}

// Auto cleanup khi import
if (typeof window !== 'undefined') {
  // Cleanup ngay khi load
  const audit = SecurityCleanup.auditLocalStorage();
  if (audit.hasUserData) {
    console.warn('🚨 Found sensitive data in localStorage on startup:', audit.sensitiveKeys);
    SecurityCleanup.cleanupUserData();
  }
}
