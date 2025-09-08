import Link from "next/link";
import { useAuth } from "@/components/auth/UserSync";
import Image from "next/image";

export default function Header() {
  const { user, isLoading, logout } = useAuth();

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-sm">
      <div className="flex items-center space-x-4">
        <Link className="text-xl font-bold" href="/">
          AI Interview
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        {isLoading ? (
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        ) : user ? (
          <div className="flex items-center space-x-3">
            {/* User Avatar */}
            {user.avatar && (
              <Image
                src={user.avatar}
                alt={user.firstName || 'User'}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            
            {/* User Info */}
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">
                {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {typeof user.role === 'string' ? user.role : 'user'}
              </p>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link
              href="/sign-in"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
             Sign in
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
} 