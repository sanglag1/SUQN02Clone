"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Home, Users, Settings, Menu, X, Search, LogOut, Shield,
  BarChart3, MessageSquare, UserCheck, Package,
  ChevronRight, ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { UserButton, useUser, useClerk } from '@clerk/nextjs';
import Image from 'next/image';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Toast from '@/components/ui/Toast';
import { useRoleInvalidation } from '@/hooks/useRoleInvalidation';
import { Logo } from '@/components/ui/logo';


export default function AdminDashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['management']);
  const [toast, setToast] = useState<{ 
    show: boolean; 
    message: string; 
    type: 'success' | 'error' | 'info' | 'warning' 
  }>({ show: false, message: '', type: 'info' });
  
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  
  // Listen for role invalidation signals
  useRoleInvalidation();
  
  // Function to confirm logout
  const confirmLogout = async () => {
    try {
      setShowLogoutConfirm(false);
      setToast({ show: true, message: 'Signing out...', type: 'info' });
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      setToast({ show: true, message: 'Sign out failed.', type: 'error' });
    }
  };
  
  // Function to check if a route is active
  const isActiveRoute = (href: string) => {
    // Use exact matching for all routes to avoid conflicts
    const normalizedPathname = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    const normalizedHref = href.endsWith('/') ? href.slice(0, -1) : href;
    
    return normalizedPathname === normalizedHref;
  };


  
  // Function to toggle expanded menus
  const toggleMenu = (menuKey: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuKey) 
        ? prev.filter(key => key !== menuKey)
        : [...prev, menuKey]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'A';
  };

  const adminMenuItems = [
    { 
      icon: Home, 
      label: 'Admin Dashboard', 
      href: '/admin/dashboard',
      key: 'dashboard'
    },
    { 
      icon: BarChart3, 
      label: 'Analytics & Reports', 
      href: '/admin/analytics',
      key: 'analytics'
    },
    {
      icon: Users,
      label: 'User Management',
      key: 'management',
      subItems: [
        { label: 'All Users', href: '/admin/users' },
        { label: 'User Activities', href: '/admin/user-activities' },
      ]
    },
    {
      icon: MessageSquare,
      label: 'Question Management',
      key: 'content',
      subItems: [
        { label: 'Questions', href: '/admin/questions' },
      ]
    },
    {
      icon: Package,
      label: 'Package Management',
      key: 'packages',
      subItems: [
        { label: 'Service Packages', href: '/admin/packages' },
        { label: 'Analytics', href: '/admin/packages/analytics' },
      ]
    },
  ];

  // Auto-expand menus that have active sub-items
  useEffect(() => {
    const menusToExpand: string[] = [];
    
    adminMenuItems.forEach((item) => {
      if (item.subItems) {
        const hasActive = item.subItems.some(subItem => pathname.startsWith(subItem.href));
        if (hasActive && !expandedMenus.includes(item.key)) {
          menusToExpand.push(item.key);
        }
      }
    });
    
    if (menusToExpand.length > 0) {
      setExpandedMenus(prev => [...prev, ...menusToExpand]);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Top Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg lg:hidden hover:bg-gray-100"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link href="/admin/dashboard" className="flex items-center ml-2 lg:ml-0">
                <Logo size="sm" />
                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">
                  Admin Panel
                </span>
              </Link>
            </div>

            <div className="flex-1 max-w-lg mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Search users, reports, settings..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              
              {/* Back to User Dashboard */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                User View
              </Link>
              
              {/* Sign Out Button */}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-2 px-2 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg text-sm font-medium transition-all duration-200"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
              
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside className={`fixed top-[61px] left-0 z-40 w-72 transition-transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`} style={{ height: 'calc(100vh - 61px)' }}>
        <div className="h-full bg-white border-r border-gray-200 flex flex-col">
          {/* Admin Info Banner */}
          <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Administrator Mode</p>
                <p className="text-xs text-gray-600">Full system access</p>
              </div>
            </div>
          </div>

          {/* Admin Navigation Menu - Scrollable */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-2">
              {adminMenuItems.map((item, index) => {
                const isExpanded = item.subItems && expandedMenus.includes(item.key);
                const isActive = item.href ? isActiveRoute(item.href) : false;
                
                return (
                  <li key={index}>
                    {item.subItems ? (
                      <>
                        <button
                          onClick={() => toggleMenu(item.key)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg group transition-colors ${
                            'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center">
                            <item.icon className={`w-5 h-5 transition-colors ${
                              'text-gray-500 group-hover:text-gray-700'
                            }`} />
                            <span className="ml-3 text-sm font-medium">
                              {item.label}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className={`w-4 h-4 text-gray-400`} />
                          ) : (
                            <ChevronRight className={`w-4 h-4 text-gray-400`} />
                          )}
                        </button>

                        {isExpanded && (
                          <ul className="pl-11 mt-2 space-y-1">
                            {item.subItems.map((subItem, subIndex) => {
                              const isSubActive = isActiveRoute(subItem.href);
                              return (
                                <li key={subIndex}>
                                  <Link
                                    href={subItem.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center p-2 text-sm rounded-lg transition-colors ${
                                      isSubActive
                                        ? 'bg-red-50 text-red-800 font-medium border-l-4 border-red-500 pl-3'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                  >
                                    {subItem.label}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </>
                    ) : (
                        <Link
                        href={item.href || '#'}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center p-3 rounded-lg group transition-colors ${
                          isActive 
                            ? 'bg-red-100 text-red-800 border border-red-200' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className={`w-5 h-5 transition-colors ${
                          isActive 
                            ? 'text-red-600' 
                            : 'text-gray-500 group-hover:text-gray-700'
                        }`} />
                        <span className="ml-3 text-sm font-medium">
                          {item.label}
                        </span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Admin Profile Section - Fixed at Bottom */}
                    <div >
                      <Link 
                        href="/profile" 
                        onClick={() => setIsSidebarOpen(false)}
                        className="block"
                      >
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 ring-2 ring-white shadow-sm">
                              {user?.imageUrl ? (
                                <Image
                                  src={user.imageUrl}
                                  alt="Profile"
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                  {getInitials(user?.fullName || 'User')}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user?.fullName || 'User'}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-500 truncate">
                                   System Administrator
                                </p>
                              </div>
                            </div>
                            <Settings className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </Link>
                    </div>
          {/* <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-gray-50">
            <div className="p-3 bg-white rounded-lg  transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 ring-2 ring-red-200 shadow-sm">
                  {user?.imageUrl ? (
                    <Image
                      src={user.imageUrl}
                      alt="Admin Profile"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-red-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                      {getInitials(user?.fullName || 'Admin')}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.fullName || 'Admin'}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 truncate">
                      System Administrator
                    </p>
                  </div>
                </div>
                <Settings className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div> */}
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-72 mt-[61px]">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Confirm Sign Out"
        message="Are you sure you want to sign out of your admin account? You will need to sign in again to continue using the admin panel."
        confirmText="Sign Out"
        cancelText="Cancel"
        type="warning"
      />

      {/* Toast Notifications */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
        duration={3000}
      />
    </div>
  );
}
