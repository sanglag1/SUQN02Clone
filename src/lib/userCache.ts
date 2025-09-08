// Cache for user list to prevent frequent database queries
interface UserListCacheData {
  success: boolean;
  users: object[];
  totalCount: number;
}

let userListCache: { data: UserListCacheData; timestamp: number } | null = null;
const USER_LIST_CACHE_DURATION = 30000; // 30 seconds

// Simple in-memory cache for user updates
const userUpdateCache = new Map<string, number>();
const userCache = new Map<string, object>();

// Function to invalidate the cache
export function invalidateUserListCache() {
  userListCache = null;
}

export function getUserListCache() {
  return userListCache;
}

export function setUserListCache(data: UserListCacheData) {
  userListCache = {
    data,
    timestamp: Date.now()
  };
}

export function getUserUpdateCache() {
  return userUpdateCache;
}

export function getUserCache() {
  return userCache;
}

export { USER_LIST_CACHE_DURATION };
