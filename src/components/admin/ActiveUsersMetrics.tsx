'use client';

import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, TrendingUp, UserCheck, Eye } from 'lucide-react';

interface ActiveUsersData {
  totalUsers: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
    currentlyOnline: number;
  };
  activityPercentage: number;
  lastUpdated: string;
}

interface ActiveUsersMetricsProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function ActiveUsersMetrics({ 
  autoRefresh = true, 
  refreshInterval = 30000 
}: ActiveUsersMetricsProps) {
  const [data, setData] = useState<ActiveUsersData>({
    totalUsers: 0,
    activeUsers: { daily: 0, weekly: 0, monthly: 0, currentlyOnline: 0 },
    activityPercentage: 0,
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActiveUsers = async () => {
    try {
      // Use the new optimized user-activities API with real-time data
      const response = await fetch('/api/admin/user-activities?limit=100');
      if (response.ok) {
        const result = await response.json();
        
        // Extract data from the new API format
        const transformedData: ActiveUsersData = {
          totalUsers: result.summary.totalUsers || 0,
          activeUsers: {
            daily: result.summary.currentlyActiveUsers || 0, // Users active in last 5 min
            weekly: result.summary.activeUsers || 0, // Users active in last 7 days  
            monthly: result.summary.activeUsers || 0, // Using same data for now
            currentlyOnline: result.summary.currentlyOnlineUsers || 0 // Users online in last 15 min
          },
          activityPercentage: result.summary.totalUsers > 0 
            ? Math.round((result.summary.currentlyOnlineUsers / result.summary.totalUsers) * 100)
            : 0,
          lastUpdated: new Date().toISOString()
        };
        
        setData(transformedData);
      } else {
        console.error('Failed to fetch active users data');
      }
    } catch (error) {
      console.error('Error fetching active users:', error);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchActiveUsers();
    setRefreshing(false);
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchActiveUsers();
      setLoading(false);
    };

    initializeData();

    // Auto refresh
    if (autoRefresh) {
      const interval = setInterval(fetchActiveUsers, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header với Manual Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Active Users Overview</h2>
          <p className="text-sm text-gray-500">
            Last updated: {formatLastUpdated(data.lastUpdated)}
            {autoRefresh && ` • Auto-refresh: ${refreshInterval/1000}s`}
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Currently Online */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Currently Online</p>
              <p className="text-3xl font-bold text-green-600">{data.activeUsers.currentlyOnline}</p>
              <p className="text-xs text-gray-500 mt-1">Active sessions</p>
            </div>
            <Eye className="h-12 w-12 text-green-500" />
          </div>
        </div>

        {/* Daily Active Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Daily Active</p>
              <p className="text-3xl font-bold text-blue-600">{data.activeUsers.daily}</p>
              <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
            </div>
            <Users className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        {/* Weekly Active Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Weekly Active</p>
              <p className="text-3xl font-bold text-purple-600">{data.activeUsers.weekly}</p>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </div>
            <UserCheck className="h-12 w-12 text-purple-500" />
          </div>
        </div>

        {/* Activity Percentage */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activity Rate</p>
              <p className="text-3xl font-bold text-orange-600">{data.activityPercentage}%</p>
              <p className="text-xs text-gray-500 mt-1">Daily/Total ratio</p>
            </div>
            <TrendingUp className="h-12 w-12 text-orange-500" />
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">
              {data.activeUsers.daily}/{data.totalUsers} users
            </span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{data.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Registered Users</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round((data.activeUsers.daily / Math.max(data.totalUsers, 1)) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Daily Engagement Rate</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((data.activeUsers.weekly / Math.max(data.totalUsers, 1)) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Weekly Engagement Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
