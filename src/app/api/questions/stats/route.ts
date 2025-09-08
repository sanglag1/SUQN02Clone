import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const allQuestions = await prisma.question.findMany({
      select: {
        fields: true,
        topics: true,
        levels: true
      }
    });

    const totalQuestions = allQuestions.length;
    
    // Extract unique values
    const allTopics = Array.from(new Set(allQuestions.flatMap(q => q.topics || [])));

    // Count statistics
    const fieldCounts = new Map<string, number>();
    const topicCounts = new Map<string, number>();
    const levelCounts = new Map<string, number>();

    allQuestions.forEach(q => {
      (q.fields || []).forEach(field => {
        fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
      });
      (q.topics || []).forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
      (q.levels || []).forEach(level => {
        levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
      });
    });

    // Create field stats for job roles
    const jobRoleFieldMapping = {
      'Frontend Developer': ['Frontend Development', 'Web Development'],
      'Backend Developer': ['Backend Development', 'Server Development'],
      'Full Stack Developer': ['Full Stack Development', 'Web Development'],
      'Mobile Developer': ['Mobile Development', 'iOS Development', 'Android Development'],
      'Data Scientist': ['Data Science', 'Machine Learning', 'AI'],
      'DevOps Engineer': ['DevOps', 'Infrastructure', 'Cloud'],
      'QA Engineer': ['Quality Assurance', 'Testing', 'QA'],
      'UI/UX Designer': ['UI/UX Design', 'Design', 'User Experience']
    };

    const mappedFieldStats = Object.entries(jobRoleFieldMapping).map(([jobRoleTitle, questionFields]) => {
      const count = questionFields.reduce((total, field) => {
        return total + (fieldCounts.get(field) || 0);
      }, 0);
      return { field: jobRoleTitle, count };
    });

    // Create level stats for job roles
    const jobRoleLevelMapping = {
      'Junior': ['junior'],
      'Mid': ['middle'],
      'Senior': ['senior']
    };

    const mappedLevelStats = Object.entries(jobRoleLevelMapping).map(([jobRoleLevel, questionLevels]) => {
      const count = questionLevels.reduce((total, level) => {
        return total + (levelCounts.get(level) || 0);
      }, 0);
      return { level: jobRoleLevel, count };
    });

    return NextResponse.json({
      totalQuestions,
      fields: Object.keys(jobRoleFieldMapping), // Job role titles
      topics: allTopics,
      levels: Object.keys(jobRoleLevelMapping), // Job role levels
      fieldStats: mappedFieldStats,
      topicStats: Array.from(topicCounts.entries()).map(([topic, count]) => ({ topic, count })),
      levelStats: mappedLevelStats,
      // expose raw category stats based directly on question fields
      categoryStats: Array.from(fieldCounts.entries()).map(([category, count]) => ({ category, count }))
    });

  } catch (error) {
    console.error('Error fetching question bank stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
