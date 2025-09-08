import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// In-memory cache for recent activity updates to prevent duplicate calls
const recentActivityCache = new Map<string, number>();
const ACTIVITY_CACHE_DURATION = 30000; // 30 seconds
const CACHE_CLEANUP_INTERVAL = 300000; // 5 minutes

export class ClerkActivityService {
  // Periodic cache cleanup
  static {
    if (typeof window === 'undefined') { // Only run on server
      setInterval(() => {
        const now = Date.now();
        Array.from(recentActivityCache.entries()).forEach(([key, timestamp]) => {
          if ((now - timestamp) > ACTIVITY_CACHE_DURATION) {
            recentActivityCache.delete(key);
          }
        });
      }, CACHE_CLEANUP_INTERVAL);
    }
  }

  /**
   * Check if we should skip this activity update due to recent activity
   */
  private static shouldSkipUpdate(clerkId: string, action: string): boolean {
    const key = `${clerkId}:${action}`;
    const lastUpdate = recentActivityCache.get(key);
    const now = Date.now();
    
    if (lastUpdate && (now - lastUpdate) < ACTIVITY_CACHE_DURATION) {
      return true; // Skip update
    }
    
    // Update cache
    recentActivityCache.set(key, now);
    return false;
  }

  /**
   * Retry function với exponential backoff
   */
  private static async retryOperation<T>(
    operation: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryOperation(operation, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  /**
   * Sync user session data từ Clerk
   */
  static async syncUserSession(clerkId: string) {
    // Check if we should skip this update
    if (this.shouldSkipUpdate(clerkId, 'sync')) {
      return { skipped: true };
    }
    
    return this.retryOperation(async () => {
      try {
        // Lấy user từ Clerk
        const clerkUserClient = await clerkClient();
        const clerkUser = await clerkUserClient.users.getUser(clerkId);
      
        const now = new Date();

        // Tìm user hoặc tạo mới
        const userData = {
          email: clerkUser.emailAddresses[0]?.emailAddress || `${clerkId}@temp.com`,
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          avatar: clerkUser.imageUrl || '',
          isOnline: true,
          clerkSessionActive: true,
          lastActivity: now,
          lastSignInAt: clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt) : now
        };

        const user = await prisma.user.upsert({
          where: { clerkId },
          create: {
            clerkId,
            ...userData
          },
          update: userData
        });
        
        return user;
      } catch (error) {
        console.error('❌ Failed to sync user session:', error);
        throw error;
      }
    });
  }

  /**
   * Set user offline (khi session ended)
   */
  static async setUserOffline(clerkId: string) {
    // Check if we should skip this update
    if (this.shouldSkipUpdate(clerkId, 'offline')) {
      return { skipped: true };
    }
    
    try {
      await prisma.user.update({
        where: { clerkId },
        data: {
          isOnline: false,
          clerkSessionActive: false,
          lastActivity: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to set user offline:', error);
    }
  }

  /**
   * Lấy active users từ Clerk sessions
   */
  static async getActiveUsers() {
    try {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000); // Tăng từ 5 phút lên 15 phút
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        onlineUsers, 
        dailyActive,
        weeklyActive
      ] = await Promise.all([
        prisma.user.count(),
        
        // Users với active Clerk session trong 15 phút qua (thay vì 5 phút)
        prisma.user.count({
          where: {
            clerkSessionActive: true,
            lastActivity: { gte: fifteenMinutesAgo }
          }
        }),
        
        // Daily active users (based on lastSignInAt or lastActivity)
        prisma.user.count({
          where: {
            OR: [
              { lastSignInAt: { gte: oneDayAgo } },
              { lastActivity: { gte: oneDayAgo } }
            ]
          }
        }),
        
        // Weekly active users
        prisma.user.count({
          where: {
            OR: [
              { lastSignInAt: { gte: oneWeekAgo } },
              { lastActivity: { gte: oneWeekAgo } }
            ]
          }
        })
      ]);

      const activityPercentage = totalUsers > 0 ? Math.round((dailyActive / totalUsers) * 100) : 0;

      return {
        totalUsers,
        activeUsers: {
          daily: dailyActive,
          weekly: weeklyActive,
          monthly: weeklyActive, // Sử dụng weekly làm tạm
          currentlyOnline: onlineUsers
        },
        activityPercentage,
        lastUpdated: now.toISOString()
      };
    } catch (error) {
      console.error('Failed to get active users:', error);
      return {
        totalUsers: 0,
        activeUsers: { daily: 0, weekly: 0, monthly: 0, currentlyOnline: 0 },
        activityPercentage: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Lấy danh sách users online (cho admin)
   */
  static async getOnlineUsersList(limit = 10) {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      const onlineUsers = await prisma.user.findMany({
        where: {
          clerkSessionActive: true,
          lastActivity: { gte: fifteenMinutesAgo }
        },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          lastActivity: true
        },
        orderBy: { lastActivity: 'desc' },
        take: limit
      });

      return onlineUsers;
    } catch (error) {
      console.error('Failed to get online users list:', error);
      return [];
    }
  }

  /**
   * Cleanup inactive sessions (chạy định kỳ)
   */
  static async cleanupInactiveSessions() {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000); // Tăng từ 10 phút lên 30 phút
      
      const result = await prisma.user.updateMany({
        where: {
          clerkSessionActive: true,
          lastActivity: { lt: thirtyMinutesAgo }
        },
        data: {
          clerkSessionActive: false,
          isOnline: false
        }
      });

      return result.count;
    } catch (error) {
      console.error('Failed to cleanup inactive sessions:', error);
      return 0;
    }
  }

  /**
   * Force set user online (khi user refresh hoặc login lại)
   */
  static async forceSetUserOnline(clerkId: string) {
    // Check if we should skip this update
    if (this.shouldSkipUpdate(clerkId, 'forceOnline')) {
      return { skipped: true };
    }
    
    try {
      const now = new Date();

      // Upsert user
      const user = await prisma.user.upsert({
        where: { clerkId },
        create: {
          clerkId,
          email: `${clerkId}@temp.com`, // Placeholder, sẽ được update từ Clerk
          isOnline: true,
          clerkSessionActive: true,
          lastActivity: now,
          lastSignInAt: now,
          roleId: 'user_role_id' // Thêm role mặc định
        },
        update: {
          isOnline: true,
          clerkSessionActive: true,
          lastActivity: now
        },
        select: {
          id: true,
          email: true,
          clerkId: true,
          isOnline: true,
          clerkSessionActive: true,
          lastActivity: true,
          lastSignInAt: true,
          role: true
        }
      });
      
      return user;
    } catch (error) {
      console.error('❌ Failed to force set user online:', error);
      throw error;
    }
  }
}
