'use client';

import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Award, Target, DollarSign, BarChart3, Settings, FileText, Activity } from 'lucide-react';

import { ChartAreaInteractive } from '@/components/ui/chart-area-interactive';
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';
import MagicDock from '@/components/ui/magicdock';
import { useRouter } from 'next/navigation';





interface RevenueData {
  totalRevenue: number;
  totalTransactions: number;
  growthRate: number;
  averageOrderValue: number;
  chartData: Array<{
    month: string;
    revenue: number;
    transactions: number;
    averageOrderValue: number;
  }>;
  topPackages: Array<{
    id: string;
    name: string;
    count: number;
    revenue: number;
  }>;
  recentPayments?: Array<{
    id: string;
    amount: number;
    packageName: string;
    userEmail: string;
    paidAt: string; // ISO datetime
    status: string;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  
  // Admin navigation items for MagicDock
  const adminDockItems = [
    {
      id: 1,
      icon: <BarChart3 className="w-6 h-6 text-white" />,
      label: "Dashboard",
      description: "Main overview",
      onClick: () => router.push("/admin/dashboard")
    },
    {
      id: 2,
      icon: <Users className="w-6 h-6 text-white" />,
      label: "Users",
      description: "Manage users",
      onClick: () => router.push("/admin/user-activities")
    },
    {
      id: 3,
      icon: <Activity className="w-6 h-6 text-white" />,
      label: "Activities",
      description: "User activities",
      onClick: () => router.push("/admin/user-activities")
    },
    {
      id: 4,
      icon: <FileText className="w-6 h-6 text-white" />,
      label: "Reports",
      description: "View reports",
      onClick: () => router.push("/admin/dashboard")
    },
    {
      id: 5,
      icon: <Settings className="w-6 h-6 text-white" />,
      label: "Settings",
      description: "Admin settings",
      onClick: () => router.push("/admin/dashboard")
    }
  ];

  
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);

  // Fetch total users from API
  const fetchUserMetrics = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        console.log('User data fetched:', data);
      }
    } catch (error) {
      console.error('Error fetching user metrics:', error);
    }
  };

  // Fetch revenue data from API
  const fetchRevenueData = async () => {
    try {
      const response = await fetch('/api/admin/revenue');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRevenueData(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  useEffect(() => {
    const initializeMetrics = async () => {
      await Promise.all([fetchUserMetrics(), fetchRevenueData()]);
      setLoading(false);
    };

    initializeMetrics();
     
  }, []);

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
    
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                <p className="text-gray-600">Manage and monitor AI interview system performance</p>
              </div>
              <button
                onClick={() => {
                  fetchUserMetrics();
                  fetchRevenueData();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="Refresh all metrics"
              >
                <TrendingUp className="w-4 h-4" />
                Refresh Data
              </button>
            </div>


          {/* Revenue Chart */}
          {loading ? (
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">PayOS Revenue Overview</h3>
                <div className="flex items-center justify-center h-[300px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-500">Loading revenue data...</span>
                </div>
              </div>
            </div>
          ) : revenueData ? (
            <div className="mb-8">
              {/* <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Test Chart (Sample Data)</h4>
                <ChartAreaInteractive 
                  data={[
                    { date: "2025-01-15", revenue: 50000, transactions: 100 },
                    { date: "2025-02-15", revenue: 75000, transactions: 35 },
                    { date: "2025-03-15", revenue: 60000, transactions: 30 },
                    { date: "2025-04-15", revenue: 90000, transactions: 45 },
                    { date: "2025-05-15", revenue: 80000, transactions: 40 },
                    { date: "2025-06-15", revenue: 110000, transactions: 55 },
                    { date: "2025-07-15", revenue: 95000, transactions: 48 },
                    { date: "2025-08-25", revenue: 150000, transactions: 75 }
                  ]}
                  title="Test Chart - Sample Revenue Data"
                  description="Testing with sample data to ensure chart works"
                  height={250}
                  hideCard={true}
                />
              </div> */}
              
              <ChartAreaInteractive 
                data={(function() {
                  // If API provides daily data via recentPayments, aggregate by date
                  const payments = revenueData.recentPayments || [];
                  const hasDailyFromPayments = payments.length > 0;
                  const hasFullDatesInChart = revenueData.chartData?.some(d => /^\d{4}-\d{2}-\d{2}$/.test(d.month));

                  if (hasDailyFromPayments && !hasFullDatesInChart) {
                    const byDate: Record<string, { revenue: number; transactions: number }> = {};
                    for (const p of payments) {
                      const day = p.paidAt.slice(0, 10); // YYYY-MM-DD
                      if (!byDate[day]) byDate[day] = { revenue: 0, transactions: 0 };
                      byDate[day].revenue += Number(p.amount) || 0;
                      byDate[day].transactions += 1;
                    }
                    return Object.entries(byDate)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([date, agg]) => ({ date, revenue: agg.revenue, transactions: agg.transactions }));
                  }

                  // Fallback: keep existing logic (month names or YYYY-MM)
                  return revenueData.chartData.map(item => {
                    let dateStr = item.month;
                    if (typeof item.month === 'string') {
                      const isFullDate = /^\d{4}-\d{2}-\d{2}$/.test(item.month);
                      if (isFullDate) {
                        dateStr = item.month;
                      } else if (!item.month.includes('-')) {
                        const monthNames = [
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ];
                        const monthIndex = monthNames.findIndex(name => 
                          item.month.toLowerCase().includes(name.toLowerCase())
                        );
                        if (monthIndex !== -1) {
                          const year = new Date().getFullYear();
                          const month = String(monthIndex + 1).padStart(2, '0');
                          dateStr = `${year}-${month}-15`;
                        }
                      } else if (item.month.match(/^\d{4}-\d{2}$/)) {
                        dateStr = `${item.month}-15`;
                      }
                    }
                    return {
                      date: dateStr,
                      revenue: item.revenue,
                      transactions: item.transactions
                    };
                  });
                })()}
                title="PayOS Revenue Overview"
                description="Showing revenue and transaction trends over time"
                height={300}
                hideCard={true}
              />
              
              {/* Revenue Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(revenueData.totalRevenue)}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">
                      {revenueData.growthRate >= 0 ? '+' : ''}{revenueData.growthRate}% from last month
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                      <p className="text-2xl font-bold text-gray-900">{revenueData.totalTransactions}</p>
                    </div>
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Target className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(revenueData.averageOrderValue)}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Award className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Top Package</p>
                      <p className="text-lg font-bold text-gray-900">
                        {revenueData.topPackages[0]?.name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {revenueData.topPackages[0] && new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(revenueData.topPackages[0].revenue)}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">PayOS Revenue Overview</h3>
                <div className="text-center text-gray-500 py-8">
                  No revenue data available
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Modal */}
        {/* <AdminUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveUser}
          user={selectedUser}
          mode={modalMode}
        /> */}
      </div>
      <MagicDock 
        items={adminDockItems}
        variant="gradient"
        magnification={75}
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
      />
    </AdminRouteGuard>
  );
}
