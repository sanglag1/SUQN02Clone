"use client";

import React, { useState } from "react";
import PersonalInfoForm from "./PersonalInfoForm";
import ActivityHistory from "./ActivityHistory";
import PaymentHistory from "./PaymentHistory";
import InterviewPreferencesForm from "./InterviewPreferencesForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/animated-tabs";
import { User, Activity, CreditCard, Settings } from "lucide-react";
import { useJobRoles } from "@/hooks/useJobRoles";

interface ProfileTabsProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    preferredJobRoleId: string;
    bio: string;
  };
  isEditing: boolean;
  onDataChange: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    preferredJobRoleId: string;
    bio: string;
  }) => void;
  onEditToggle: () => void;
  onSubmit: () => void;
  userId?: string;
}

type TabType = "personal" | "activity" | "payment" | "preferences";

export default function ProfileTabs({
  formData,
  isEditing,
  onDataChange,
  onEditToggle,
  onSubmit,
  userId
}: ProfileTabsProps) {
  const { jobRoles, isLoading: jobRolesLoading, error: jobRolesError } = useJobRoles();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal">
            <User className="w-5 h-5 mr-3" />
            <span className="hidden sm:inline">Personal Info</span>
            <span className="sm:hidden text-xs">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="w-5 h-5 mr-3" />
            <span className="hidden sm:inline">Activity</span>
            <span className="sm:hidden text-xs">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="w-5 h-5 mr-3" />
            <span className="hidden sm:inline">Payment</span>
            <span className="sm:hidden text-xs">Payment</span>
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="w-5 h-5 mr-3" />
            <span className="hidden sm:inline">Interview</span>
            <span className="sm:hidden text-xs">Interview</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <div className="min-h-[500px] transition-all duration-300">
            <PersonalInfoForm
              formData={formData}
              isEditing={isEditing}
              onDataChange={onDataChange}
              onEditToggle={onEditToggle}
              onSubmit={onSubmit}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="activity">
          <div className="min-h-[500px] transition-all duration-300">
            <ActivityHistory userId={userId} />
          </div>
        </TabsContent>
        
        <TabsContent value="payment">
          <div className="min-h-[500px] transition-all duration-300">
            <PaymentHistory userId={userId} />
          </div>
        </TabsContent>
        
        <TabsContent value="preferences">
          <div className="min-h-[500px] transition-all duration-300">
            {jobRolesLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : jobRolesError ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-red-600">Error: {jobRolesError}</div>
              </div>
            ) : (
              <InterviewPreferencesForm 
                jobRoles={jobRoles}
                onSave={(preferences) => {
                  console.log('Preferences saved:', preferences);
                  // You can add a toast notification here
                }}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
