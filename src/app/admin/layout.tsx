import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout';
import prisma from '@/lib/prisma';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Get current user from Clerk
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect('/sign-in');
  }

  // Check user role using Prisma
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { role: true }
    });
    
    if (!user || user.role?.name !== 'admin') {
      redirect('/access-denied');
    }
  } catch (error) {
    // Don't log redirect errors as they are expected
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error; // Re-throw redirect errors
    }
    console.error('Error checking admin role:', error);
    redirect('/access-denied');
  }

  return (
    <AdminDashboardLayout>
      {children}
    </AdminDashboardLayout>
  );
}
