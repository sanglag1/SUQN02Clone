"use client";

import { useState } from 'react';
import { Activity, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/animated-tabs';
import AdminActivityDashboard from '@/components/admin/AdminActivityDashboard';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import UserActivitiesList from '@/components/admin/UserActivitiesList';
import UserActivityDetailView from '@/components/admin/UserActivityDetailView';

export default function AdminUserActivitiesPage() {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleViewDetails = (userId: string) => {
    setSelectedUserId(userId);
    setViewMode('detail');
  };

  const handleEditUser = (userId: string) => {
    // Implement edit functionality
    console.log('Edit user:', userId);
  };

  const handleDeleteUser = async (userId: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to delete this user\'s activity data? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/user-activities/${userId}/manage?type=all&confirm=true`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        // Show success message
        alert("User activity data deleted successfully.");
        
        // Refresh the list or update state as needed
        window.location.reload(); // Simple refresh for now
      } else {
        alert(result.error || "Failed to delete user activity data.");
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert("An unexpected error occurred.");
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedUserId(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Activity Management</h1>
        <p className="text-gray-600 mt-2">
          Monitor, analyze, and manage user activities and learning progress across the platform.
        </p>
      </div>

      <div className="space-y-6">
        <Tabs defaultValue="realtime">
          <TabsList>
            <TabsTrigger value="realtime">
              <Activity className="h-4 w-4 mr-2" />
              Real-time Activity
            </TabsTrigger>
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="realtime">
            <div className="space-y-6">
              <AdminActivityDashboard />
            </div>
          </TabsContent>

          <TabsContent value="overview">
            <div className="space-y-6">
              <AdminAnalytics />
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-6">
              {viewMode === 'list' ? (
                <UserActivitiesList
                  onViewDetails={handleViewDetails}
                  onEditUser={handleEditUser}
                  onDeleteUser={handleDeleteUser}
                />
              ) : selectedUserId ? (
                <UserActivityDetailView
                  userId={selectedUserId}
                  onBack={handleBackToList}
                />
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
