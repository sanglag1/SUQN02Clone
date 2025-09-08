'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Users, Edit, Shield, UserCheck, MoreVertical, Trash2 } from 'lucide-react';
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import Toast from '@/components/ui/Toast';
import { useRole } from '@/context/RoleContext';
import { useRoleInvalidation } from '@/hooks/useRoleInvalidation';
import { useUser } from '@clerk/nextjs';
import { X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface User {
  id?: string;
  _id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  imageUrl?: string;
  role: 'admin' | 'user';
  lastActivity?: string;
  isOnline?: boolean;
  clerkSessionActive?: boolean;
  lastSignInAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const { loading } = useRole();
  const { refreshRole } = useRole();
  const { broadcastRoleInvalidation } = useRoleInvalidation();
  const { user: currentUser } = useUser();

  // Helper function to get user initials
  const getUserInitials = (fullName: string | undefined): string => {
    if (!fullName) return 'U';
    const names = fullName.split(' ').slice(0, 2);
    return (names[0]?.[0] || '') + (names[1]?.[0] || '');
  };

  // Helper function to parse name parts
  const parseNameParts = (fullName: string | undefined) => {
    if (!fullName) return { firstName: '', lastName: '' };
    const parts = fullName.split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    };
  };

  // Helper function to check if user is current user
  const isCurrentUser = (user: User) => {
    return currentUser && user.clerkId === currentUser.id;
  };

  // Helper function to check if user can be deleted
  const canDeleteUser = (user: User) => {
    return !isCurrentUser(user); // Không thể xóa chính mình
  };

  



  const [users, setUsers] = useState<User[]>([]);
  
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ 
    show: boolean; 
    message: string; 
    type: 'success' | 'error' | 'info' | 'warning' 
  }>({ 
    show: false, 
    message: '', 
    type: 'info' 
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState<{ firstName: string; lastName: string; email: string; role: 'admin' | 'user' }>({ firstName: '', lastName: '', email: '', role: 'user' });

  const [isFetching, setIsFetching] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    // Fetch users ngay khi component mount
    void fetchUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch users khi tab được focus (user quay lại tab)
  useEffect(() => {
    const handleFocus = () => {
      // Chỉ fetch nếu users array rỗng hoặc đã quá 5 phút từ lần fetch cuối
      if (users.length === 0 || !lastFetchTime || (Date.now() - lastFetchTime) > 300000) {
        void fetchUsers(false); // Không clear cache khi focus
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [users.length, lastFetchTime]);

  // Fetch users khi role thay đổi (để đảm bảo data luôn mới nhất)
  useEffect(() => {
    if (!loading && users.length === 0) {
      void fetchUsers(true);
    }
  }, [loading]); // Chỉ chạy khi loading state thay đổi

  // Unified guarded fetch to avoid duplicate requests
  const fetchUsers = async (clearCache: boolean = true) => {
    if (isFetching) return;
    try {
      setIsFetching(true);
      if (clearCache) {
        await fetch('/api/user/clear-cache', { method: 'POST' });
      }
      const timestamp = Date.now();
      const response = await fetch(`/api/user?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setLastFetchTime(Date.now()); // Cập nhật thời gian fetch cuối cùng
      } else {
        showToast('Failed to fetch users', 'error');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Error fetching users', 'error');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!selectedUserId) return;
    const u = users.find(x => x._id === selectedUserId || x.id === selectedUserId || x.clerkId === selectedUserId);
    if (!u) return;
    const parts = parseNameParts(u.fullName);
    setEditForm({
      firstName: u.firstName || parts.firstName,
      lastName: u.lastName || parts.lastName,
      email: u.email,
      role: (typeof u.role === 'string' ? u.role : 'user') as 'admin' | 'user',
    });
  }, [selectedUserId, users]);

  // Derived: filtered + paginated users
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter(u => {
      const name = (u.fullName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const matchesQ = q === '' || name.includes(q) || email.includes(q);
      const roleStr = (typeof u.role === 'string' ? u.role : 'user') as 'admin' | 'user';
      const matchesRole = roleFilter === 'all' || roleStr === roleFilter;
      const isOnline = Boolean(u.isOnline);
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'online' ? isOnline : !isOnline);
      return matchesQ && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Reset to first page when filters/search change or users change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, roleFilter, statusFilter, pageSize, users.length]);

  const saveInlineEdit = async (u: User) => {
    try {
      // Kiểm tra: Không cho phép admin tự hạ cấp chính mình
      if (isCurrentUser(u) && editForm.role === 'user') {
        showToast('You cannot demote yourself from admin role', 'error');
        return;
      }

      setEditSaving(true);
      const response = await fetch(`/api/user/${u.clerkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (response.ok) {
        setUsers(prev => prev.map(x => {
          // Sử dụng clerkId để xác định chính xác user cần update
          if (x.clerkId === u.clerkId) {
            return {
              ...x,
              email: editForm.email,
              role: editForm.role,
              fullName: `${editForm.firstName} ${editForm.lastName}`.trim(),
              firstName: editForm.firstName,
              lastName: editForm.lastName,
            };
          }
          return x;
        }));
        broadcastRoleInvalidation(u.clerkId);
        refreshRole();
        showToast(`Updated ${editForm.firstName} ${editForm.lastName}`, 'success');
        setSelectedUserId(null);
      } else {
        showToast('Failed to update user', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update user information', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({ show: true, message, type });
  };

  

  

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/user/${deletingUser.clerkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh in-memory list without full reload
        await fetchUsers();
        showToast(`Successfully deleted ${deletingUser.fullName}`, 'success');
        setDeletingUser(null);
      } else {
        const errorData = await response.json();
        showToast(`Failed to delete ${deletingUser.fullName}: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast(`Failed to delete ${deletingUser.fullName}`, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminRouteGuard>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminRouteGuard>
    );
  }

  return (
    <AdminRouteGuard>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage user roles and permissions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {isFetching ? 'Loading...' : `${filteredUsers.length} total`}
              </span>
            </div>
            {/* Controls: search, filters, page size */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-visible">
            {isFetching && users.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading users...</p>
                </div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                  <tr key={user._id || user.id || user.clerkId} className="hover:bg-gray-50">
                    <td
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => setSelectedUserId(user.id || user._id || user.clerkId)}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          {user.imageUrl ? (
                            <Image
                              src={user.imageUrl}
                              alt={user.fullName}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {getUserInitials(user.fullName)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullName || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (typeof user.role === 'string' ? user.role : 'user') === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {(typeof user.role === 'string' ? user.role : 'user') === 'admin' ? (
                          <Shield className="w-3 h-3 mr-1" />
                        ) : (
                          <UserCheck className="w-3 h-3 mr-1" />
                        )}
                        {typeof user.role === 'string' ? user.role : 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end">
                        <DropdownMenu 
                          trigger={
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>
                          }
                        >
                          <DropdownMenuItem onClick={() => setSelectedUserId(user.id || user._id || user.clerkId)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {/* Chỉ hiển thị nút Promote/Demote nếu có thể thay đổi role */}
                          {/* {canChangeUserRole(user, (typeof user.role === 'string' ? user.role : 'user') === 'admin' ? 'user' : 'admin') && (
                            <DropdownMenuItem 
                              onClick={() => changeUserRole(user.clerkId, (typeof user.role === 'string' ? user.role : 'user') === 'admin' ? 'user' : 'admin')}
                            >
                              {(typeof user.role === 'string' ? user.role : 'user') === 'admin' ? (
                                <>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Demote to User
                                </>
                              ) : (
                                <>
                                  <Shield className="w-4 h-4 mr-2" />
                                  Promote to Admin
                                </>
                              )}
                            </DropdownMenuItem>
                          )} */}
                          <DropdownMenuSeparator />
                          {/* Chỉ hiển thị nút Delete nếu không phải chính mình */}
                          {canDeleteUser(user) && (
                            <DropdownMenuItem 
                              onClick={() => setDeletingUser(user)}
                              className="text-red-600"
                            >
                              {deleteLoading && deletingUser?._id === user._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                              ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                              )}
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
                                </tbody>
                </table>
              )}
            </div>
          {/* Pagination footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={currentPage === 1}>First</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>Last</Button>
              </div>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="h-9 w-[100px]"><SelectValue placeholder="Rows" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="25">25 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <ConfirmDeleteModal
          user={deletingUser ? {
            ...deletingUser,
            ...(!deletingUser.firstName || !deletingUser.lastName ? parseNameParts(deletingUser.fullName) : {
              firstName: deletingUser.firstName,
              lastName: deletingUser.lastName
            })
          } : null}
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={handleDeleteUser}
          loading={deleteLoading}
        />

        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />

        {selectedUserId && (() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const selectedUser = users.find(u => (u._id === selectedUserId) || ((u as any).id === selectedUserId) || (u.clerkId === selectedUserId));
          if (!selectedUser) return null;
          const initial = getUserInitials(selectedUser.fullName);
          const roleBadgeClass = (typeof selectedUser.role === 'string' ? selectedUser.role : 'user') === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedUserId(null)}></div>
              <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-white/20">
                      {selectedUser.imageUrl ? (
                        <Image src={selectedUser.imageUrl} alt={selectedUser.fullName} width={56} height={56} className="w-14 h-14 object-cover" />
                      ) : (
                        <span className="text-lg font-bold">{initial}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-semibold truncate">{selectedUser.fullName}</h2>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass} bg-white/90 text-gray-900`}>{typeof selectedUser.role === 'string' ? selectedUser.role : 'user'}</span>
                      </div>
                      <p className="text-sm opacity-90 truncate">{selectedUser.email}</p>
                    </div>
                    <button onClick={() => setSelectedUserId(null)} className="p-2 rounded hover:bg-white/10 transition">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {/* Body: Inline edit form */}
                <div className="p-5 md:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                      <Input value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} placeholder="First name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                      <Input value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} placeholder="Last name" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v as 'admin' | 'user' })}>
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                {/* Footer: Save / Cancel */}
                <div className="px-5 md:px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-2">
                  <Button variant="secondary" onClick={() => setSelectedUserId(null)} disabled={editSaving}>Cancel</Button>
                  <Button onClick={() => saveInlineEdit(selectedUser)} disabled={editSaving}>{editSaving ? 'Saving...' : 'Save'}</Button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </AdminRouteGuard>
  );
}
