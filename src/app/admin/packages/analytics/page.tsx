'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Users, Clock, Package, DollarSign, Activity } from 'lucide-react';
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Toast from '@/components/ui/Toast';
import { ChartAreaDefault } from '@/components/ui/chart-area-default';

interface PackageAnalytics {
  totalPackages: number;
  activePackages: number;
  totalRevenue: number;
  totalUsers: number;
  packageUsage: {
    packageId: string;
    packageName: string;
    userCount: number;
    revenue: number;
    isActive: boolean;
  }[];
  expiringPackages: {
    packageId: string;
    packageName: string;
    userCount: number;
    daysUntilExpiry: number;
  }[];
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
}

export default function PackageAnalyticsPage() {
  const [analytics, setAnalytics] = useState<PackageAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [toast, setToast] = useState<{ 
    show: boolean; 
    message: string; 
    type: 'success' | 'error' | 'info' | 'warning' 
  }>({ 
    show: false, 
    message: '', 
    type: 'info' 
  });

    const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/packages/analytics?timeRange=${timeRange}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        showToast('Failed to fetch analytics data', 'error');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showToast('Error fetching analytics data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({ show: true, message, type });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  if (isLoading) {
    return (
      <AdminRouteGuard>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminRouteGuard>
    );
  }

  if (!analytics) {
    return (
      <AdminRouteGuard>
        <div className="text-center py-12">
          <p className="text-gray-500">No analytics data available</p>
        </div>
      </AdminRouteGuard>
    );
  }

  return (
    <AdminRouteGuard>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Package Analytics</h1>
              <p className="text-gray-600">Comprehensive insights into package performance and usage</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchAnalytics} variant="outline">
                <Activity className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Packages</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.totalPackages)}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">{analytics.activePackages} active</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">{timeRange} period</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.totalUsers)}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-500">Active subscribers</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analytics.totalUsers > 0 
                    ? formatCurrency(analytics.totalRevenue / analytics.totalUsers)
                    : formatCurrency(0)
                  }
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-500">Per user</span>
            </div>
          </div>
        </div>
        {/* Monthly Revenue Chart */}
        <div className="mt-8 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <ChartAreaDefault
              data={analytics.monthlyRevenue.map(item => ({
                month: item.month,
                revenue: item.revenue
              }))}
              title="Monthly Revenue Trend"
              description="Revenue trend over the last 6 months"
              showFooter={true}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Package Usage Statistics */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Package Usage Statistics</h3>
                <p className="text-sm text-gray-500">Current package distribution</p>
              </div>
            </div>
            <div className="space-y-4">
              {analytics.packageUsage.map((pkg) => (
                <div key={pkg.packageId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{pkg.packageName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={pkg.isActive ? "default" : "secondary"}>
                          {pkg.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {pkg.userCount} users
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-gray-900">{formatCurrency(pkg.revenue)}</p>
                    <p className="text-xs text-gray-500">
                      {pkg.userCount > 0 ? formatCurrency(pkg.revenue / pkg.userCount) : formatCurrency(0)} per user
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expiring Packages */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Expiring Packages</h3>
                <p className="text-sm text-gray-500">Packages nearing expiration</p>
              </div>
            </div>
            <div className="space-y-4">
              {analytics.expiringPackages.length > 0 ? (
                analytics.expiringPackages.map((pkg) => (
                  <div key={pkg.packageId} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{pkg.packageName}</p>
                        <p className="text-xs text-orange-600 mt-1">
                          {pkg.daysUntilExpiry} days until expiry
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">
                        {pkg.daysUntilExpiry <= 7 ? 'Critical' : 
                         pkg.daysUntilExpiry <= 30 ? 'Warning' : 'Info'}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {pkg.userCount} users affected
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No packages expiring soon</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      </div>
    </AdminRouteGuard>
  );
}
