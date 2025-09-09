import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  TrendingUp, 
  Users, 
  Activity, 
  Target,
  Clock,
  Star,
  Eye,
  Edit,
  Trash2,
  Download
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Helper component for avatar with fallback
const UserAvatar = ({ user }: { user: UserActivity['user'] }) => {
  const [imageError, setImageError] = useState(false);
  
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  if (!user.avatar || imageError) {
    return (
      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
        {getUserInitials(user.firstName, user.lastName)}
      </div>
    );
  }

  return (
    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium overflow-hidden">
      <Image 
        src={user.avatar} 
        alt={`${user.firstName} ${user.lastName}`}
        width={40}
        height={40}
        className="w-full h-full object-cover rounded-full"
        onError={() => setImageError(true)}
      />
    </div>
  );
};

interface UserActivity {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    role?: unknown;
    realTimeActivity?: {
      isCurrentlyActive: boolean;
      isCurrentlyOnline: boolean;
      lastActivityText: string;
      lastActivityTimestamp: string | Date;
    };
  };
  stats: {
    totalActivities: number;
    totalStudyTime: number;
    averageScore: number;
    studyStreak: number;
    totalInterviews: number;
    totalQuizzes: number;
    totalPractice: number;
    completedGoals: number;
    activeGoals: number;
  };
  lastUpdated?: string | Date;
}

interface UserActivitiesListProps {
  onViewDetails: (userId: string) => void;
  onEditUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

export default function UserActivitiesList({
  onViewDetails,
  onEditUser,
  onDeleteUser
}: UserActivitiesListProps) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('lastActive');
  const [sortOrder, setSortOrder] = useState('desc');
  const [skillFilter, setSkillFilter] = useState('all');
  const [goalStatusFilter, setGoalStatusFilter] = useState('all');
  const [summary, setSummary] = useState({
    totalUsers: 0,
    activeUsersToday: 0,
    totalActivities: 0,
    totalCompletedGoals: 0,
    averageStudyTime: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search,
        sortBy,
        sortOrder,
        ...(skillFilter && skillFilter !== 'all' && { skill: skillFilter }),
        ...(goalStatusFilter && goalStatusFilter !== 'all' && { goalStatus: goalStatusFilter })
      });

      const response = await fetch(`/api/admin/user-activities?${params}`);
      const data = await response.json();

      if (response.ok) {
        setActivities(data.activities || []);
        setSummary({
          totalUsers: data.summary?.totalUsers || 0,
          activeUsersToday: data.summary?.currentlyOnlineUsers || data.summary?.currentlyActiveUsers || 0,
          totalActivities: data.summary?.totalActivities || 0,
          totalCompletedGoals: 0,
          averageStudyTime: 0
        });
        setPagination(data.pagination || {
          page: 1,
          limit: 10,
          total: data.activities?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        });
      } else {
        console.error('Error fetching activities:', data.error);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, sortBy, sortOrder, skillFilter, goalStatusFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatLastActive = (date: string) => {
    const now = new Date();
    const lastActive = new Date(date);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastActive.toLocaleDateString();
  };

  const getStatusBadge = (user: UserActivity['user']) => {
    const rt = user.realTimeActivity;
    if (rt?.isCurrentlyOnline) {
      return <Badge className="bg-green-100 text-green-800">Online</Badge>;
    }
    if (rt?.isCurrentlyActive) {
      return <Badge className="bg-yellow-100 text-yellow-800">Active</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Offline</Badge>;
  };

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{summary.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Active Today</p>
                <p className="text-2xl font-bold">{summary.activeUsersToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-purple-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Activities</p>
                <p className="text-2xl font-bold">{summary.totalActivities}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-4 w-4 text-orange-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Goals Complete</p>
                <p className="text-2xl font-bold">{summary.totalCompletedGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-red-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Avg Study Time</p>
                <p className="text-2xl font-bold">{formatDuration(summary.averageStudyTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>User Activities</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name, email, skills, or goals..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                <SelectItem value="JavaScript">JavaScript</SelectItem>
                <SelectItem value="Python">Python</SelectItem>
                <SelectItem value="React">React</SelectItem>
                <SelectItem value="Node.js">Node.js</SelectItem>
                <SelectItem value="Communication">Communication</SelectItem>
              </SelectContent>
            </Select>

            <Select value={goalStatusFilter} onValueChange={setGoalStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by goal status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Goals</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastActive-desc">Last Active (Recent)</SelectItem>
                <SelectItem value="lastActive-asc">Last Active (Oldest)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="totalActivities-desc">Most Active</SelectItem>
                <SelectItem value="averageSkillScore-desc">Highest Score</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User Activities Table */}
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <UserAvatar user={activity.user} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.user.firstName} {activity.user.lastName}
                      </p>
                      {getStatusBadge(activity.user)}
                      {(typeof activity.user.role === 'string' ? activity.user.role : 'user') === 'admin' && (
                        <Badge variant="secondary">Admin</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {activity.user.email}
                    </p>
                  </div>

                  <div className="hidden sm:flex items-center space-x-6 text-sm text-gray-500">
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {activity.stats.totalActivities}
                      </div>
                      <div>Activities</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {activity.stats.completedGoals}/{activity.stats.activeGoals}
                      </div>
                      <div>Goals</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center">
                        <Star className="h-3 w-3 text-yellow-400 mr-1" />
                        <span className="font-medium text-gray-900">
                          {activity.stats.averageScore}
                        </span>
                      </div>
                      <div>Avg Score</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {formatDuration(activity.stats.totalStudyTime)}
                      </div>
                      <div>Study Time</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {activity.stats.studyStreak}
                      </div>
                      <div>Streak</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {formatLastActive(String(activity.user.realTimeActivity?.lastActivityTimestamp || activity.lastUpdated || ''))}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onViewDetails(activity.user.id)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onEditUser(activity.user.id)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDeleteUser(activity.user.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination?.total || 0} results
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    const pageNum = Math.max(1, currentPage - 2) + i;
                    if (pageNum > pagination.totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
