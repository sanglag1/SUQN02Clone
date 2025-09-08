'use client';

import { NotFoundPage } from '@/components/errors';

export default function NotFound() {
  return (
    <NotFoundPage 
      title="Page Not Found"
      description="Sorry, the page you are looking for doesn't exist or has been moved. Please check the URL or return to the homepage."
      showQuickLinks={true}
    />
  );
}
