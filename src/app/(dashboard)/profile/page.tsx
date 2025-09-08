"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import Toast from "@/components/ui/Toast";
import {
  ProfileLoading,
  ProfileTabs
} from "@/components/Profile";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";


export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  
  // Simplified state
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ 
    show: boolean; 
    message: string; 
    type: 'success' | 'error' | 'info' | 'warning' 
  }>({ show: false, message: '', type: 'info' });
  
  const [profileData, setProfileData] = useState({
    phone: "",
    department: "",
    preferredJobRoleId: "",
    bio: "",
  });

  // State for editable user info
  const [editableUserInfo, setEditableUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  // Update editable info when user changes
  useEffect(() => {
    setEditableUserInfo({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.emailAddresses?.[0]?.emailAddress || "",
    });
  }, [user?.firstName, user?.lastName, user?.emailAddresses]);

  // Combined form data
  const formData = useMemo(() => ({
    ...profileData,
    firstName: editableUserInfo.firstName,
    lastName: editableUserInfo.lastName,
    email: editableUserInfo.email,
  }), [profileData, editableUserInfo]);

  // Optimized profile fetch - only fetch additional data, not basic user info
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;
    
    let isMounted = true;
    
    const fetchAdditionalProfile = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch("/api/profile", {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
          // Silently fail - use default empty values
          return;
        }
        
        const data = await response.json();
        
        if (isMounted) {
          setProfileData({
            phone: data.phone || "",
            department: data.department || "",
            preferredJobRoleId: data.preferredJobRoleId || "",
            bio: data.bio || "",
          });
          
          // Also update editable user info with database values if they exist
          if (data.firstName !== undefined || data.lastName !== undefined) {
            setEditableUserInfo(prev => ({
              ...prev,
              firstName: data.firstName || prev.firstName,
              lastName: data.lastName || prev.lastName,
            }));
          }
        }
      } catch (error) {
        // Silently handle error - profile still works with basic data
        console.warn("Could not fetch additional profile data:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAdditionalProfile();
    
    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, user?.id]);

  const handleSubmit = async () => {
    if (!user?.id) return;
    
    try {
      setToast({ show: true, message: 'Saving...', type: 'info' });
      
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profileData,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          clerkId: user.id,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        setToast({ show: true, message: 'Saved successfully!', type: 'success' });
        
        // Cập nhật thông tin user trong Clerk nếu firstName/lastName thay đổi
        if (user.firstName !== formData.firstName || user.lastName !== formData.lastName) {
          try {
            await user.update({
              firstName: formData.firstName,
              lastName: formData.lastName
            });
            await user.reload();
          } catch (clerkError) {
            console.warn('Could not update Clerk user:', clerkError);
          }
        }
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setToast({ show: true, message: 'Save failed. Try again.', type: 'error' });
    }
  };

  const updateProfileData = (data: Record<string, string>) => {
    // Update profile fields
    const profileFields = ['phone', 'department', 'preferredJobRoleId', 'bio'];
    const profileUpdate: Partial<typeof profileData> = {};
    const userInfoUpdate: Partial<typeof editableUserInfo> = {};
    
    Object.keys(data).forEach(key => {
      if (profileFields.includes(key)) {
        (profileUpdate as Record<string, string>)[key] = data[key];
      } else if (['firstName', 'lastName', 'email'].includes(key)) {
        (userInfoUpdate as Record<string, string>)[key] = data[key];
      }
    });
    
    if (Object.keys(profileUpdate).length > 0) {
      setProfileData(prev => ({ ...prev, ...profileUpdate }));
    }
    
    if (Object.keys(userInfoUpdate).length > 0) {
      setEditableUserInfo(prev => ({ ...prev, ...userInfoUpdate }));
    }
  };

  
  // Show loading only for auth, not for additional profile data
  if (!isLoaded) {
    return (
      <DashboardLayout>
        <ProfileLoading isAuthenticating={true} />
      </DashboardLayout>
    );
  }

  if (!isSignedIn) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <p>You need to sign in to view this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full space-y-6 p-6">
          {/* Header Profile Card */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-10" />
            <CardContent className="p-3">
              <div className="flex flex-row items-center gap-3">
                {/* Compact Avatar Section */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 shadow-lg">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white">
                      {user?.imageUrl ? (
                        <Image
                          src={user.imageUrl}
                          alt="Profile"
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {(formData.firstName?.charAt(0) || '') + (formData.lastName?.charAt(0) || '')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Info Section */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-gray-900 truncate">
                    {formData.firstName} {formData.lastName}
                  </h1>
                  <p className="text-sm text-gray-600 truncate">{formData.email}</p>
                  {profileData.bio && (
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {profileData.bio}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Profile Management</h2>
              {isLoading && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Loading additional data...</span>
                </div>
              )}
            </div>
            
            <ProfileTabs
              formData={{
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: profileData.phone,
                department: profileData.department,
                preferredJobRoleId: profileData.preferredJobRoleId,
                bio: profileData.bio
              }}
              isEditing={isEditing}
              onDataChange={updateProfileData}
              onEditToggle={() => setIsEditing(true)}
              onSubmit={handleSubmit}
              userId={user?.id}
            />
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
        duration={3000}
      />
    </DashboardLayout>
  );
}