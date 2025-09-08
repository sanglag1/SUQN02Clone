import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface ProgressStats {
  totalInterviews: number;
  averageScore: number;
  studyStreak: number;
  totalStudyTime: number;
}

interface SkillProgress {
  name: string;
  level: string;
  score: number;
  progress: Array<{
    date: Date;
    score: number;
  }>;
}

interface ProgressData {
  stats: ProgressStats;
  skillProgress: SkillProgress[];
  currentFocus: string[];
  nextMilestones: Array<{
    goal: string;
    targetDate: Date;
  }>;
  recommendations: string[];
}

export default function ProgressDashboard() {
  const { user, isLoaded } = useUser();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      try {
        // Chỉ fetch khi đã load user
        if (!user?.id) return;

        const response = await fetch('/api/tracking');
        const data = await response.json();
        setProgress(data);
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded) {
      fetchProgress();
    }
  }, [user?.id, isLoaded]);

  if (loading) {
    return <div>Loading progress...</div>;
  }

  if (!progress) {
    return <div>No progress data available</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Học tập Streak */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Learning Streak</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">
              {progress.stats.studyStreak}
            </div>
            <div className="text-gray-600">Days Streak</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">
              {progress.stats.totalInterviews}
            </div>
            <div className="text-gray-600">Interviews</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">
              {Math.round(progress.stats.averageScore)}%
            </div>
            <div className="text-gray-600">Average Score</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">
              {Math.round(progress.stats.totalStudyTime / 60)}h
            </div>
            <div className="text-gray-600">Total Study Time</div>
          </div>
        </div>
      </div>

      {/* Kỹ năng Progress */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Skills Progress</h2>
        <div className="space-y-4">
          {progress.skillProgress.map((skill) => (
            <div key={skill.name} className="relative">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{skill.name}</span>
                <span className="text-sm text-gray-600">{skill.level}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded">
                <div
                  className="h-2 bg-indigo-600 rounded"
                  style={{ width: `${skill.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mục tiêu hiện tại */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Current Focus</h2>
          <ul className="space-y-2">
            {progress.currentFocus.map((focus, index) => (
              <li key={index} className="flex items-center">
                <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2" />
                {focus}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Recommendations</h2>
          <ul className="space-y-2">
            {progress.recommendations.map((rec, index) => (
              <li key={index} className="flex items-center text-gray-700">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Upcoming Milestones */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-2xl font-semibold mb-4">Upcoming Milestones</h2>
        <div className="space-y-4">
          {progress.nextMilestones.map((milestone, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="font-medium">{milestone.goal}</span>
              <span className="text-sm text-gray-600">
                {new Date(milestone.targetDate).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
