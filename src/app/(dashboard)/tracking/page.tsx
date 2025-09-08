import { Metadata } from 'next';
import TrackingDashboard from '@/components/dashboard/TrackingDashboard';

export const metadata: Metadata = {
  title: 'Learning Progress Tracking',
  description: 'Track your interview preparation progress and learning journey',
};

export default function TrackingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Learning Journey</h1>
      <TrackingDashboard />
    </div>
  );
}
