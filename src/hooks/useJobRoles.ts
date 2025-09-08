import { useState, useEffect } from 'react';

export interface JobRole {
  id: string;
  key: string;
  title: string;
  level: 'Intern' | 'Junior' | 'Mid' | 'Senior' | 'Lead';
  description?: string;
  minExperience: number;
  maxExperience?: number;
  order: number;
  category?: {
    id: string;
    name: string;
    skills?: string[];
  };
  categoryId?: string;
  specialization?: {
    id: string;
    name: string;
  };
  specializationId?: string;
}

export function useJobRoles() {
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobRoles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/positions');
        if (!response.ok) {
          throw new Error('Failed to fetch job roles');
        }
        
        const data = await response.json();
        setJobRoles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching job roles:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobRoles();
  }, []);

  return { jobRoles, isLoading, error };
}

