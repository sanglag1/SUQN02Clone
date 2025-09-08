/**
 * Service để mapping giữa các level enum khác nhau trong hệ thống
 */

// Định nghĩa các enum levels
export enum ExperienceLevel {
  JUNIOR = 'junior',
  MID = 'mid', 
  SENIOR = 'senior'
}

export enum QuizLevel {
  JUNIOR = 'junior',
  MIDDLE = 'middle',
  SENIOR = 'senior'
}

export enum JobLevel {
  INTERN = 'Intern',
  JUNIOR = 'Junior',
  MID = 'Mid',
  SENIOR = 'Senior',
  LEAD = 'Lead'
}

// Mapping từ JobLevel sang QuizLevel
export const jobLevelToQuizLevel: Record<JobLevel, QuizLevel[]> = {
  [JobLevel.INTERN]: [QuizLevel.JUNIOR],
  [JobLevel.JUNIOR]: [QuizLevel.JUNIOR],
  [JobLevel.MID]: [QuizLevel.MIDDLE],
  [JobLevel.SENIOR]: [QuizLevel.SENIOR],
  [JobLevel.LEAD]: [QuizLevel.SENIOR]
};

// Mapping từ JobLevel sang ExperienceLevel
export const jobLevelToExperienceLevel: Record<JobLevel, ExperienceLevel> = {
  [JobLevel.INTERN]: ExperienceLevel.JUNIOR,
  [JobLevel.JUNIOR]: ExperienceLevel.JUNIOR,
  [JobLevel.MID]: ExperienceLevel.MID,
  [JobLevel.SENIOR]: ExperienceLevel.SENIOR,
  [JobLevel.LEAD]: ExperienceLevel.SENIOR
};

// Mapping từ QuizLevel sang JobLevel
export const quizLevelToJobLevel: Record<QuizLevel, JobLevel[]> = {
  [QuizLevel.JUNIOR]: [JobLevel.INTERN, JobLevel.JUNIOR],
  [QuizLevel.MIDDLE]: [JobLevel.MID],
  [QuizLevel.SENIOR]: [JobLevel.SENIOR, JobLevel.LEAD]
};

// Mapping từ ExperienceLevel sang JobLevel
export const experienceLevelToJobLevel: Record<ExperienceLevel, JobLevel[]> = {
  [ExperienceLevel.JUNIOR]: [JobLevel.INTERN, JobLevel.JUNIOR],
  [ExperienceLevel.MID]: [JobLevel.MID],
  [ExperienceLevel.SENIOR]: [JobLevel.SENIOR, JobLevel.LEAD]
};

/**
 * Chuyển đổi JobLevel sang QuizLevel array
 */
export function convertJobLevelToQuizLevels(jobLevel: JobLevel): QuizLevel[] {
  return jobLevelToQuizLevel[jobLevel] || [QuizLevel.JUNIOR];
}

/**
 * Chuyển đổi JobLevel sang ExperienceLevel
 */
export function convertJobLevelToExperienceLevel(jobLevel: JobLevel): ExperienceLevel {
  return jobLevelToExperienceLevel[jobLevel] || ExperienceLevel.JUNIOR;
}

/**
 * Chuyển đổi QuizLevel sang JobLevel array
 */
export function convertQuizLevelToJobLevels(quizLevel: QuizLevel): JobLevel[] {
  return quizLevelToJobLevel[quizLevel] || [JobLevel.JUNIOR];
}

/**
 * Chuyển đổi ExperienceLevel sang JobLevel array
 */
export function convertExperienceLevelToJobLevels(experienceLevel: ExperienceLevel): JobLevel[] {
  return experienceLevelToJobLevel[experienceLevel] || [JobLevel.JUNIOR];
}

/**
 * Kiểm tra xem JobLevel có tương thích với QuizLevel không
 */
export function isJobLevelCompatibleWithQuizLevel(jobLevel: JobLevel, quizLevel: QuizLevel): boolean {
  const compatibleQuizLevels = convertJobLevelToQuizLevels(jobLevel);
  return compatibleQuizLevels.includes(quizLevel);
}

/**
 * Lấy tất cả QuizLevel có thể sử dụng cho JobLevel
 */
export function getCompatibleQuizLevels(jobLevel: JobLevel): QuizLevel[] {
  return convertJobLevelToQuizLevels(jobLevel);
}

/**
 * Lấy tất cả JobLevel có thể sử dụng cho QuizLevel
 */
export function getCompatibleJobLevels(quizLevel: QuizLevel): JobLevel[] {
  return convertQuizLevelToJobLevels(quizLevel);
}

/**
 * Tạo mapping cho API endpoints
 */
export function createLevelMappingForAPI(): Record<string, string[]> {
  return {
    'Intern': ['junior'],
    'Junior': ['junior'],
    'Mid': ['middle'],
    'Senior': ['senior'],
    'Lead': ['senior']
  };
}

/**
 * Tạo mapping cho field mapping
 */
export function createFieldMappingForAPI(): Record<string, string[]> {
  return {
    'Frontend': ['Frontend Development', 'Web Development'],
    'Backend': ['Backend Development', 'Server Development'],
    'Full Stack': ['Full Stack Development', 'Full Stack'],
    'Mobile': ['Mobile Development', 'iOS Development', 'Android Development'],
    'Data Science': ['Data Science', 'Machine Learning', 'AI'],
    'DevOps': ['DevOps', 'Infrastructure', 'Cloud'],
    'QA': ['Quality Assurance', 'Testing', 'QA'],
    'UI/UX': ['UI/UX Design', 'Design', 'User Experience']
  };
}

/**
 * Utility function để validate level mapping
 */
export function validateLevelMapping() {
  console.log('🔍 Validating level mappings...');
  
  // Test JobLevel to QuizLevel
  Object.values(JobLevel).forEach(jobLevel => {
    const quizLevels = convertJobLevelToQuizLevels(jobLevel);
    console.log(`${jobLevel} -> QuizLevel: [${quizLevels.join(', ')}]`);
  });
  
  // Test QuizLevel to JobLevel
  Object.values(QuizLevel).forEach(quizLevel => {
    const jobLevels = convertQuizLevelToJobLevels(quizLevel);
    console.log(`${quizLevel} -> JobLevel: [${jobLevels.join(', ')}]`);
  });
  
  console.log('✅ Level mapping validation complete');
}
