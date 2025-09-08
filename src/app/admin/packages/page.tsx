'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, MoreVertical, BarChart3 } from 'lucide-react';
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import ConfirmDeletePackageModal from '@/components/admin/ConfirmDeletePackageModal';
import Toast from '@/components/ui/Toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServicePackage {
  id: string;
  name: string;
  price: number;
  duration: number;
  avatarInterviewLimit: number;
  testQuizEQLimit: number;
  jdUploadLimit: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingPackage, setDeletingPackage] = useState<ServicePackage | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [toast, setToast] = useState<{ 
    show: boolean; 
    message: string; 
    type: 'success' | 'error' | 'info' | 'warning' 
  }>({ 
    show: false, 
    message: '', 
    type: 'info' 
  });

  const [editForm, setEditForm] = useState({
    name: '',
    price: 0,
    duration: 30,
    avatarInterviewLimit: 0,
    testQuizEQLimit: 0,
    jdUploadLimit: 0,
    description: '',
    isActive: true
  });

  const [createForm, setCreateForm] = useState({
    name: '',
    price: 0,
    duration: 30,
    avatarInterviewLimit: 0,
    testQuizEQLimit: 0,
    jdUploadLimit: 0,
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    if (isFetching) return;
    try {
      setIsFetching(true);
      const response = await fetch('/api/admin/packages', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      } else {
        showToast('Failed to fetch packages', 'error');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      showToast('Error fetching packages', 'error');
    } finally {
      setIsFetching(false);
    }
  };

  // Filtered packages
  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pkg.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' ? pkg.isActive : !pkg.isActive);
    return matchesSearch && matchesStatus;
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({ show: true, message, type });
  };

  const handleCreatePackage = async () => {
    try {
      const response = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        await fetchPackages();
        showToast('Package created successfully', 'success');
        setIsCreateModalOpen(false);
        setCreateForm({
          name: '',
          price: 0,
          duration: 30,
          avatarInterviewLimit: 0,
          testQuizEQLimit: 0,
          jdUploadLimit: 0,
          description: '',
          isActive: true
        });
      } else {
        showToast('Failed to create package', 'error');
      }
    } catch (error) {
      console.error('Error creating package:', error);
      showToast('Failed to create package', 'error');
    }
  };

  const handleEditPackage = async () => {
    if (!selectedPackage) return;
    
    try {
      const response = await fetch(`/api/admin/packages/${selectedPackage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        await fetchPackages();
        showToast('Package updated successfully', 'success');
        setIsEditModalOpen(false);
        setSelectedPackage(null);
      } else {
        showToast('Failed to update package', 'error');
      }
    } catch (error) {
      console.error('Error updating package:', error);
      showToast('Failed to update package', 'error');
    }
  };

  const handleDeletePackage = async () => {
    if (!deletingPackage) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/admin/packages/${deletingPackage.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPackages();
        showToast(`Successfully deleted ${deletingPackage.name}`, 'success');
        setDeletingPackage(null);
      } else {
        const errorData = await response.json();
        showToast(`Failed to delete ${deletingPackage.name}: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      showToast(`Failed to delete ${deletingPackage.name}`, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = (pkg: ServicePackage) => {
    setSelectedPackage(pkg);
    setEditForm({
      name: pkg.name,
      price: pkg.price,
      duration: pkg.duration,
      avatarInterviewLimit: pkg.avatarInterviewLimit,
      testQuizEQLimit: pkg.testQuizEQLimit,
      jdUploadLimit: pkg.jdUploadLimit,
      description: pkg.description || '',
      isActive: pkg.isActive
    });
    setIsEditModalOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDuration = (days: number) => {
    if (days === 30) return '1 month';
    if (days === 90) return '3 months';
    if (days === 180) return '6 months';
    if (days === 365) return '1 year';
    return `${days} days`;
  };

  if (isFetching && packages.length === 0) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Package Management</h1>
              <p className="text-gray-600">Manage service packages and pricing</p>
            </div>
            <Button 
              onClick={() => window.location.href = '/admin/packages/analytics'} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Service Packages</h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {filteredPackages.length} total
                </span>
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Package
              </Button>
            </div>

            {/* Controls: search, filters */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search packages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Limits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                        <div className="text-sm text-gray-500">{pkg.description || 'No description'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatPrice(pkg.price)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDuration(pkg.duration)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div>Avatar: {pkg.avatarInterviewLimit}</div>
                        <div>Quiz: {pkg.testQuizEQLimit}</div>
                        <div>JD: {pkg.jdUploadLimit}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pkg.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <DropdownMenu 
                        trigger={
                          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                        }
                      >
                        <DropdownMenuItem onClick={() => openEditModal(pkg)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeletingPackage(pkg)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Package Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <h2 className="text-xl font-semibold">Create New Package</h2>
                <p className="text-sm opacity-90">Add a new service package</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                    <Input 
                      value={createForm.name} 
                      onChange={e => setCreateForm({ ...createForm, name: e.target.value })} 
                      placeholder="Package name" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (VND)</label>
                    <Input 
                      type="number" 
                      value={createForm.price} 
                      onChange={e => setCreateForm({ ...createForm, price: Number(e.target.value) })} 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                    <Input 
                      type="number" 
                      value={createForm.duration} 
                      onChange={e => setCreateForm({ ...createForm, duration: Number(e.target.value) })} 
                      placeholder="30" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Avatar Interview Limit</label>
                    <Input 
                      type="number" 
                      value={createForm.avatarInterviewLimit} 
                      onChange={e => setCreateForm({ ...createForm, avatarInterviewLimit: Number(e.target.value) })} 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quiz/EQ Limit</label>
                    <Input 
                      type="number" 
                      value={createForm.testQuizEQLimit} 
                      onChange={e => setCreateForm({ ...createForm, testQuizEQLimit: Number(e.target.value) })} 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">JD Upload Limit</label>
                    <Input 
                      type="number" 
                      value={createForm.jdUploadLimit} 
                      onChange={e => setCreateForm({ ...createForm, jdUploadLimit: Number(e.target.value) })} 
                      placeholder="0" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <Input 
                      value={createForm.description} 
                      onChange={e => setCreateForm({ ...createForm, description: e.target.value })} 
                      placeholder="Package description" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={createForm.isActive}
                        onChange={e => setCreateForm({ ...createForm, isActive: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-2">
                <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePackage}>
                  Create Package
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Package Modal */}
        {isEditModalOpen && selectedPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
                <h2 className="text-xl font-semibold">Edit Package: {selectedPackage.name}</h2>
                <p className="text-sm opacity-90">Update package details</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                    <Input 
                      value={editForm.name} 
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                      placeholder="Package name" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (VND)</label>
                    <Input 
                      type="number" 
                      value={editForm.price} 
                      onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })} 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                    <Input 
                      type="number" 
                      value={editForm.duration} 
                      onChange={e => setEditForm({ ...editForm, duration: Number(e.target.value) })} 
                      placeholder="30" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Avatar Interview Limit</label>
                    <Input 
                      type="number" 
                      value={editForm.avatarInterviewLimit} 
                      onChange={e => setEditForm({ ...editForm, avatarInterviewLimit: Number(e.target.value) })} 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quiz/EQ Limit</label>
                    <Input 
                      type="number" 
                      value={editForm.testQuizEQLimit} 
                      onChange={e => setEditForm({ ...editForm, testQuizEQLimit: Number(e.target.value) })} 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">JD Upload Limit</label>
                    <Input 
                      type="number" 
                      value={editForm.jdUploadLimit} 
                      onChange={e => setEditForm({ ...editForm, jdUploadLimit: Number(e.target.value) })} 
                      placeholder="0" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <Input 
                      value={editForm.description} 
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })} 
                      placeholder="Package description" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-2">
                <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditPackage}>
                  Update Package
                </Button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDeletePackageModal
          package={deletingPackage}
          isOpen={!!deletingPackage}
          onClose={() => setDeletingPackage(null)}
          onConfirm={handleDeletePackage}
          loading={deleteLoading}
        />

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
