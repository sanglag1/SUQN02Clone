"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Home, Brain, FileQuestion,  History, 
  Star, Settings, Menu, X, Search, LogOut, Shield,
  ChevronRight, ChevronDown, BookOpen, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { UserButton, useUser, useClerk } from '@clerk/nextjs';
import Image from 'next/image';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Toast from '@/components/ui/Toast';
import ActivityReminderModal from '@/components/ui/ActivityReminderModal';
import CelebrationModal from '@/components/ui/CelebrationModal';
import { useRole } from '@/context/RoleContext';
import { useRoleInvalidation } from '@/hooks/useRoleInvalidation';
import { useActivityHeartbeat } from '@/hooks/useActivityHeartbeat';
import OnboardingGuard from '@/components/OnboardingGuard';
import { Logo } from '@/components/ui/logo';


export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['practice']); // Mặc định mở Practice Modes
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showActivityReminder, setShowActivityReminder] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState(0);
  const [userProgress, setUserProgress] = useState({
    streak: 0,
    completedToday: 0,
    totalTarget: 10
  });
  const [toast, setToast] = useState<{ 
    show: boolean; 
    message: string; 
    type: 'success' | 'error' | 'info' | 'warning' 
  }>({ show: false, message: '', type: 'info' });
  
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { isAdmin } = useRole();
  
  // Listen for role invalidation signals
  useRoleInvalidation();
  
  // Activity heartbeat to track online status
  useActivityHeartbeat();
  
  // Check user activity and show reminder modal
  useEffect(() => {
    const checkUserActivity = async () => {
      try {
        if (!user?.id) {
          return;
        }
        
        // Fetch user progress
        const response = await fetch('/api/tracking');
        
        if (response.ok) {
          const data = await response.json();
          
          const progress = {
            streak: data.stats?.studyStreak || 0,
            completedToday: data.recentActivities?.filter((activity: { timestamp: string }) => {
              const today = new Date().toDateString();
              const activityDate = new Date(activity.timestamp).toDateString();
              return today === activityDate;
            }).length || 0,
            totalTarget: 10
          };
          
          setUserProgress(progress);
          
          // Check for streak milestones and show celebration
          const milestones = [3, 10, 30, 50, 100];
          const currentMilestone = milestones.find(m => progress.streak === m);
          
          if (currentMilestone) {
            const celebrationKey = `celebration_${currentMilestone}_${new Date().toDateString()}`;
            const hasShownToday = localStorage.getItem(celebrationKey);
            
            if (!hasShownToday) {
              setCelebrationMilestone(currentMilestone);
              setTimeout(() => {
                setShowCelebration(true);
                localStorage.setItem(celebrationKey, 'true');
              }, 1000);
            }
          }
          
          // Show reminder if user has NO activity today (regardless of streak)
          const shouldShow = progress.completedToday === 0;
          
          if (shouldShow) {
            // Enable localStorage check để chỉ hiện 1 lần trong ngày
            const today = new Date().toDateString();
            const lastShown = localStorage.getItem('activityReminderShown');
            
            if (lastShown !== today) {
              setTimeout(() => {
                setShowActivityReminder(true);
                localStorage.setItem('activityReminderShown', today);
              }, 2000); // Show after 2 seconds
            }
          }

          // NEW: force show reminder once right after onboarding
          const forceReminder = localStorage.getItem('showStreakReminderAfterOnboarding');
          if (forceReminder === '1') {
            setTimeout(() => {
              setShowActivityReminder(true);
              localStorage.removeItem('showStreakReminderAfterOnboarding');
            }, 1500);
          }
        }
      } catch {
        // Silent error handling
      }
    };

    if (user) {
      checkUserActivity();
    }
  }, [user]);
  
  // Memoize menu items để tránh re-render không cần thiết
  const menuItems = useMemo(() => [
    { 
      icon: Home, 
      label: 'Dashboard', 
      href: '/dashboard',
      key: 'dashboard'
    },
    { 
      icon: BookOpen, 
      label: 'Review Question', 
      href: '/review',
      key: 'review'
  },
    { 
      icon: Brain, 
      label: 'Practice Modes', 
      key: 'practice',
      subItems: [
        { label: 'AI Bot', href: '/avatar-interview' },
        { label: 'Quiz Mode', href: '/quiz' },
        { label: 'Assessment Mode', href: '/test' },
      ]
    },
   
    { 
      icon: FileQuestion, 
      label: 'JD Analysis', 
      href: '/jd',
      key: 'jd'
    },
    
    { 
      icon: History, 
      label: 'History Quiz', 
      href: '/history',
      key: 'history'
    },
    {
      icon: BarChart3,
      label: 'Usage',
      href: '/usage',
      key: 'usage'
    },
    { 
      icon: Star, 
      label: 'Saved Questions', 
      href: '/saved',
      key: 'saved'
    },
  
  ], []);

  // Optimized modal close functions
  const closeActivityReminder = useCallback(() => {
    setShowActivityReminder(false);
  }, []);

  const closeCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  // Optimized logout function
  const confirmLogout = useCallback(async () => {
    try {
      setShowLogoutConfirm(false);
      setToast({ show: true, message: 'Signing out...', type: 'info' });
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      setToast({ show: true, message: 'Sign out failed.', type: 'error' });
    }
  }, [signOut]);
  
  // Optimized route checking functions
  const isActiveRoute = useCallback((href: string) => {
    if (!pathname) return false;
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  }, [pathname]);

  const hasActiveSubItem = useCallback((subItems: { href: string }[]) => {
    if (!pathname) return false;
    return subItems.some(subItem => pathname.startsWith(subItem.href));
  }, [pathname]);

  // Optimized menu toggle function
  const toggleMenu = useCallback((menuKey: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuKey) 
        ? prev.filter(key => key !== menuKey)
        : [...prev, menuKey]
    );
  }, []);

  // Optimized initials function
  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'U';
  }, []);

  return (
    <OnboardingGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
        <div className="px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg lg:hidden hover:bg-gray-100"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link href="/dashboard" className="flex items-center ml-2 lg:ml-0">
                <Logo size="sm" />
              </Link>
            </div>

            <div className="flex-1 max-w-lg mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Search questions, exercises..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">  
              {/* Admin Panel Access - Only show for admins */}
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
              
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

      {/* Sidebar */}
      <aside className={`fixed top-[61px] left-0 z-40 w-64 transition-transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`} style={{ height: 'calc(100vh - 61px)' }}>
        <div className="h-full bg-white border-r border-gray-200 flex flex-col">
          {/* Navigation Menu - Scrollable */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-2">
              {menuItems.map((item, index) => {
                const isActive = item.href ? isActiveRoute(item.href) : false;
                const hasActiveSub = item.subItems ? hasActiveSubItem(item.subItems) : false;
                const shouldHighlight = isActive || hasActiveSub;
                const isExpanded = item.subItems && expandedMenus.includes(item.key);
                
                return (
                  <li key={index}>
                    {item.subItems ? (
                      <>
                        <button
                          onClick={() => toggleMenu(item.key)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg group transition-colors ${
                            shouldHighlight 
                              ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-600' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center">
                            <item.icon className={`w-5 h-5 transition-colors ${
                              shouldHighlight 
                                ? 'text-purple-600' 
                                : 'text-gray-500 group-hover:text-purple-600'
                            }`} />
                            <span className={`ml-3 text-sm font-medium ${
                              shouldHighlight ? 'font-semibold' : ''
                            }`}>
                              {item.label}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </button>

                        {isExpanded && (
                          <ul className="pl-11 mt-2 space-y-1">
                            {item.subItems.map((subItem, subIndex) => {
                              const isSubActive = pathname.startsWith(subItem.href);
                              
                              return (
                                <li key={subIndex}>
                                  <Link
                                    href={subItem.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center p-2 text-sm rounded-lg transition-colors ${
                                      isSubActive 
                                        ? 'bg-purple-100 text-purple-700 font-medium' 
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
                          shouldHighlight 
                            ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-600' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className={`w-5 h-5 transition-colors ${
                          shouldHighlight 
                            ? 'text-purple-600' 
                            : 'text-gray-500 group-hover:text-purple-600'
                        }`} />
                        <span className={`ml-3 text-sm font-medium ${
                          shouldHighlight ? 'font-semibold' : ''
                        }`}>
                          {item.label}
                        </span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* User Profile Section - Fixed at Bottom */}
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
                        Manage your account
                      </p>
                    </div>
                  </div>
                  <Settings className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 mt-[61px] min-h-screen">
        <div className="w-full p-3 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
          {children}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Confirm Sign Out"
        message="Are you sure you want to sign out of your account? You will need to sign in again to continue using the service."
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

      {/* Activity Reminder Modal */}
      {showActivityReminder && (
        <ActivityReminderModal
          isOpen={showActivityReminder}
          onClose={closeActivityReminder}
          userProgress={userProgress}
        />
      )}

      {/* Celebration Modal */}
      {showCelebration && celebrationMilestone && userProgress && (
        <CelebrationModal
          isOpen={showCelebration}
          onClose={closeCelebration}
          milestone={celebrationMilestone}
          streakCount={userProgress.streak}
        />
      )}
      
        </div>
      </OnboardingGuard>
    );
}
