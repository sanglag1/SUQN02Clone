"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";

interface UserActivityData {
  id: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    realTimeActivity: {
      isCurrentlyActive: boolean;
      isCurrentlyOnline: boolean;
      lastActivityText: string;
      lastActivityTimestamp: string;
    };
  };
  stats: {
    totalActivities: number;
    averageScore: number;
  };
}

// Summary type was unused; remove to satisfy linter

export default function AdminActivityDashboard() {
  const [activities, setActivities] = useState<UserActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // filter/sort states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "score" | "activities">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const fetchActivityData = async () => {
    try {
      const response = await fetch("/api/admin/user-activities?limit=20", { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error fetching activity data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityData();

    const interval = setInterval(fetchActivityData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Lọc dữ liệu theo search + status
  const filteredActivities = activities.filter((a) => {
    const name = `${a.user.firstName ?? ""} ${a.user.lastName ?? ""} ${a.user.email}`.toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === "active") matchesStatus = a.user.realTimeActivity.isCurrentlyActive;
    else if (statusFilter === "online") matchesStatus = a.user.realTimeActivity.isCurrentlyOnline;
    else if (statusFilter === "offline")
      matchesStatus =
        !a.user.realTimeActivity.isCurrentlyActive &&
        !a.user.realTimeActivity.isCurrentlyOnline;

    return matchesSearch && matchesStatus;
  });

  // Sắp xếp
  filteredActivities.sort((a, b) => {
    let valA: number | string = "";
    let valB: number | string = "";

    if (sortBy === "name") {
      valA = `${a.user.firstName ?? ""} ${a.user.lastName ?? ""}`;
      valB = `${b.user.firstName ?? ""} ${b.user.lastName ?? ""}`;
    } else if (sortBy === "score") {
      valA = a.stats.averageScore;
      valB = b.stats.averageScore;
    } else if (sortBy === "activities") {
      valA = a.stats.totalActivities;
      valB = b.stats.totalActivities;
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards giữ nguyên */}

      {/* Filter & Sort Controls */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow">
        {/* Search */}
        <div className="flex items-center border rounded px-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ml-2 outline-none p-1 text-sm"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={(e) => setSortBy(e.target.value as any)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="name">Sort by Name</option>
          <option value="score">Sort by Score</option>
          <option value="activities">Sort by Activities</option>
        </select>

        <button
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="border rounded px-2 py-1 text-sm"
        >
          {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Real-time User Activity
          </h3>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Activities
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredActivities.map((activity) => (
                <tr key={activity.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {activity.user.firstName} {activity.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {activity.user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activity.user.realTimeActivity.isCurrentlyActive
                          ? "bg-green-100 text-green-800"
                          : activity.user.realTimeActivity.isCurrentlyOnline
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {activity.user.realTimeActivity.isCurrentlyActive
                        ? "Active"
                        : activity.user.realTimeActivity.isCurrentlyOnline
                        ? "Online"
                        : "Offline"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.user.realTimeActivity.lastActivityText}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.stats.totalActivities}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.stats.averageScore.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
