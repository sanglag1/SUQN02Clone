/**
 * Service để mapping giữa JobRole và Question Bank
 * Đảm bảo AI có thể tạo câu hỏi phù hợp dựa trên job role
 */

export interface JobRoleMapping {
  jobRoleId: string;
  jobRoleKey: string;
  jobRoleTitle: string;
  jobRoleLevel: string;
  categoryName: string;
  specializationName?: string;
  skills: string[];
  questionFields: string[];
  questionTopics: string[];
  questionLevels: string[];
  aiContextKeywords: string[];
  interviewFocusAreas: string[];
}

export interface QuestionBankMapping {
  field: string;
  topics: string[];
  levels: string[];
  skills: string[];
  jobRoles: string[];
}

/**
 * Mapping chi tiết từ JobRole sang Question Bank
 */
export const JOB_ROLE_TO_QUESTION_MAPPING: Record<string, JobRoleMapping> = {
  // Frontend Development
  'frontend_developer_junior': {
    jobRoleId: '',
    jobRoleKey: 'frontend_developer_junior',
    jobRoleTitle: 'Frontend Developer',
    jobRoleLevel: 'Junior',
    categoryName: 'Frontend',
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Git', 'Responsive Design'],
    questionFields: ['Frontend Development', 'Web Development'],
    questionTopics: ['HTML/CSS', 'JavaScript', 'React', 'Web Fundamentals', 'DOM Manipulation'],
    questionLevels: ['junior'],
    aiContextKeywords: ['frontend', 'web development', 'user interface', 'client-side', 'browser'],
    interviewFocusAreas: ['Basic HTML/CSS knowledge', 'JavaScript fundamentals', 'React basics', 'Responsive design', 'Git workflow']
  },
  
  'frontend_developer_mid': {
    jobRoleId: '',
    jobRoleKey: 'frontend_developer_mid',
    jobRoleTitle: 'Frontend Developer',
    jobRoleLevel: 'Mid',
    categoryName: 'Frontend',
    skills: ['React', 'TypeScript', 'State Management', 'Performance Optimization', 'Testing', 'Build Tools'],
    questionFields: ['Frontend Development', 'Web Development'],
    questionTopics: ['React Advanced', 'TypeScript', 'State Management', 'Performance', 'Testing', 'Build Tools'],
    questionLevels: ['middle'],
    aiContextKeywords: ['frontend', 'react', 'typescript', 'performance', 'testing', 'state management'],
    interviewFocusAreas: ['Advanced React patterns', 'TypeScript proficiency', 'State management solutions', 'Performance optimization', 'Testing strategies']
  },

  'frontend_developer_senior': {
    jobRoleId: '',
    jobRoleKey: 'frontend_developer_senior',
    jobRoleTitle: 'Frontend Developer',
    jobRoleLevel: 'Senior',
    categoryName: 'Frontend',
    skills: ['Architecture Design', 'Team Leadership', 'Code Review', 'Mentoring', 'Performance', 'Security'],
    questionFields: ['Frontend Development', 'Web Development'],
    questionTopics: ['Architecture', 'Leadership', 'Code Review', 'Performance', 'Security', 'Best Practices'],
    questionLevels: ['senior'],
    aiContextKeywords: ['frontend architecture', 'team leadership', 'code review', 'performance optimization', 'security'],
    interviewFocusAreas: ['System architecture', 'Team leadership', 'Code review process', 'Performance optimization', 'Security best practices']
  },

  // Backend Development
  'backend_developer_junior': {
    jobRoleId: '',
    jobRoleKey: 'backend_developer_junior',
    jobRoleTitle: 'Backend Developer',
    jobRoleLevel: 'Junior',
    categoryName: 'Backend',
    skills: ['Python', 'Java', 'Node.js', 'SQL', 'Git', 'Basic APIs'],
    questionFields: ['Backend Development', 'Server Development'],
    questionTopics: ['Programming Fundamentals', 'Databases', 'APIs', 'Server Basics', 'Git'],
    questionLevels: ['junior'],
    aiContextKeywords: ['backend', 'server', 'database', 'api', 'programming'],
    interviewFocusAreas: ['Programming fundamentals', 'Database basics', 'API development', 'Server concepts', 'Version control']
  },

  'backend_developer_mid': {
    jobRoleId: '',
    jobRoleKey: 'backend_developer_mid',
    jobRoleTitle: 'Backend Developer',
    jobRoleLevel: 'Mid',
    categoryName: 'Backend',
    skills: ['System Design', 'Microservices', 'Caching', 'Message Queues', 'Testing', 'DevOps'],
    questionFields: ['Backend Development', 'Server Development'],
    questionTopics: ['System Design', 'Microservices', 'Caching', 'Message Queues', 'Testing', 'DevOps'],
    questionLevels: ['middle'],
    aiContextKeywords: ['system design', 'microservices', 'caching', 'message queues', 'testing', 'devops'],
    interviewFocusAreas: ['System design principles', 'Microservices architecture', 'Caching strategies', 'Message queue systems', 'Testing methodologies']
  },

  'backend_developer_senior': {
    jobRoleId: '',
    jobRoleKey: 'backend_developer_senior',
    jobRoleTitle: 'Backend Developer',
    jobRoleLevel: 'Senior',
    categoryName: 'Backend',
    skills: ['Architecture', 'Scalability', 'Security', 'Team Leadership', 'Mentoring', 'Code Review'],
    questionFields: ['Backend Development', 'Server Development'],
    questionTopics: ['Architecture', 'Scalability', 'Security', 'Leadership', 'Code Review'],
    questionLevels: ['senior'],
    aiContextKeywords: ['architecture', 'scalability', 'security', 'leadership', 'code review'],
    interviewFocusAreas: ['System architecture', 'Scalability design', 'Security implementation', 'Team leadership', 'Code review process']
  },

  // Full Stack Development
  'fullstack_developer_junior': {
    jobRoleId: '',
    jobRoleKey: 'fullstack_developer_junior',
    jobRoleTitle: 'Full Stack Developer',
    jobRoleLevel: 'Junior',
    categoryName: 'Full Stack',
    skills: ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git'],
    questionFields: ['Full Stack Development', 'Web Development'],
    questionTopics: ['Frontend Basics', 'Backend Basics', 'Full Stack Integration', 'Web Fundamentals'],
    questionLevels: ['junior'],
    aiContextKeywords: ['full stack', 'frontend', 'backend', 'web development', 'integration'],
    interviewFocusAreas: ['Frontend fundamentals', 'Backend basics', 'Full stack integration', 'Web development workflow']
  },

  'fullstack_developer_mid': {
    jobRoleId: '',
    jobRoleKey: 'fullstack_developer_mid',
    jobRoleTitle: 'Full Stack Developer',
    jobRoleLevel: 'Mid',
    categoryName: 'Full Stack',
    skills: ['React', 'Node.js', 'TypeScript', 'Databases', 'APIs', 'Testing'],
    questionFields: ['Full Stack Development', 'Web Development'],
    questionTopics: ['Frontend Advanced', 'Backend Advanced', 'Full Stack Architecture', 'Testing', 'APIs'],
    questionLevels: ['middle'],
    aiContextKeywords: ['full stack', 'react', 'node.js', 'typescript', 'architecture', 'testing'],
    interviewFocusAreas: ['Advanced frontend', 'Advanced backend', 'Full stack architecture', 'Testing strategies', 'API design']
  },

  'fullstack_developer_senior': {
    jobRoleId: '',
    jobRoleKey: 'fullstack_developer_senior',
    jobRoleTitle: 'Full Stack Developer',
    jobRoleLevel: 'Senior',
    categoryName: 'Full Stack',
    skills: ['Architecture', 'Team Leadership', 'Code Review', 'Performance', 'Security', 'Mentoring'],
    questionFields: ['Full Stack Development', 'Web Development'],
    questionTopics: ['Architecture', 'Leadership', 'Code Review', 'Performance', 'Security'],
    questionLevels: ['senior'],
    aiContextKeywords: ['full stack architecture', 'leadership', 'code review', 'performance', 'security'],
    interviewFocusAreas: ['System architecture', 'Team leadership', 'Code review process', 'Performance optimization', 'Security implementation']
  },

  // Mobile Development
  'mobile_developer_junior': {
    jobRoleId: '',
    jobRoleKey: 'mobile_developer_junior',
    jobRoleTitle: 'Mobile Developer',
    jobRoleLevel: 'Junior',
    categoryName: 'Mobile',
    skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Mobile UI', 'Git'],
    questionFields: ['Mobile Development', 'iOS Development', 'Android Development'],
    questionTopics: ['Mobile Fundamentals', 'React Native', 'Flutter', 'Mobile UI', 'Platform Basics'],
    questionLevels: ['junior'],
    aiContextKeywords: ['mobile', 'react native', 'flutter', 'ios', 'android', 'mobile ui'],
    interviewFocusAreas: ['Mobile development basics', 'Cross-platform frameworks', 'Mobile UI design', 'Platform-specific knowledge']
  },

  'mobile_developer_mid': {
    jobRoleId: '',
    jobRoleKey: 'mobile_developer_mid',
    jobRoleTitle: 'Mobile Developer',
    jobRoleLevel: 'Mid',
    categoryName: 'Mobile',
    skills: ['Advanced Mobile', 'Performance', 'Testing', 'State Management', 'Native Modules'],
    questionFields: ['Mobile Development', 'iOS Development', 'Android Development'],
    questionTopics: ['Advanced Mobile', 'Performance', 'Testing', 'State Management', 'Native Modules'],
    questionLevels: ['middle'],
    aiContextKeywords: ['mobile performance', 'testing', 'state management', 'native modules', 'mobile architecture'],
    interviewFocusAreas: ['Mobile performance optimization', 'Testing strategies', 'State management', 'Native module integration']
  },

  // Data Science
  'data_scientist_junior': {
    jobRoleId: '',
    jobRoleKey: 'data_scientist_junior',
    jobRoleTitle: 'Data Scientist',
    jobRoleLevel: 'Junior',
    categoryName: 'Data Science',
    skills: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'SQL', 'Statistics'],
    questionFields: ['Data Science', 'Machine Learning', 'AI'],
    questionTopics: ['Python', 'Data Analysis', 'Statistics', 'SQL', 'Basic ML'],
    questionLevels: ['junior'],
    aiContextKeywords: ['data science', 'python', 'data analysis', 'statistics', 'machine learning'],
    interviewFocusAreas: ['Python programming', 'Data analysis skills', 'Statistical knowledge', 'SQL proficiency', 'Basic machine learning']
  },

  'data_scientist_mid': {
    jobRoleId: '',
    jobRoleKey: 'data_scientist_mid',
    jobRoleTitle: 'Data Scientist',
    jobRoleLevel: 'Mid',
    categoryName: 'Data Science',
    skills: ['Machine Learning', 'Deep Learning', 'Scikit-learn', 'TensorFlow', 'Model Evaluation'],
    questionFields: ['Data Science', 'Machine Learning', 'AI'],
    questionTopics: ['Machine Learning', 'Deep Learning', 'Model Evaluation', 'Feature Engineering'],
    questionLevels: ['middle'],
    aiContextKeywords: ['machine learning', 'deep learning', 'model evaluation', 'feature engineering', 'ai'],
    interviewFocusAreas: ['Machine learning algorithms', 'Deep learning frameworks', 'Model evaluation techniques', 'Feature engineering']
  },

  'data_scientist_senior': {
    jobRoleId: '',
    jobRoleKey: 'data_scientist_senior',
    jobRoleTitle: 'Data Scientist',
    jobRoleLevel: 'Senior',
    categoryName: 'Data Science',
    skills: ['MLOps', 'Model Deployment', 'Team Leadership', 'Research', 'Architecture'],
    questionFields: ['Data Science', 'Machine Learning', 'AI'],
    questionTopics: ['MLOps', 'Model Deployment', 'Leadership', 'Research', 'Architecture'],
    questionLevels: ['senior'],
    aiContextKeywords: ['mlops', 'model deployment', 'leadership', 'research', 'ai architecture'],
    interviewFocusAreas: ['MLOps practices', 'Model deployment strategies', 'Team leadership', 'Research methodologies', 'AI system architecture']
  },

  // DevOps
  'devops_engineer_junior': {
    jobRoleId: '',
    jobRoleKey: 'devops_engineer_junior',
    jobRoleTitle: 'DevOps Engineer',
    jobRoleLevel: 'Junior',
    categoryName: 'DevOps',
    skills: ['Linux', 'Docker', 'Git', 'CI/CD', 'Cloud Basics', 'Scripting'],
    questionFields: ['DevOps', 'Infrastructure', 'Cloud'],
    questionTopics: ['Linux', 'Docker', 'CI/CD', 'Cloud Basics', 'Scripting'],
    questionLevels: ['junior'],
    aiContextKeywords: ['devops', 'linux', 'docker', 'ci/cd', 'cloud', 'scripting'],
    interviewFocusAreas: ['Linux administration', 'Containerization', 'CI/CD pipelines', 'Cloud fundamentals', 'Scripting skills']
  },

  'devops_engineer_mid': {
    jobRoleId: '',
    jobRoleKey: 'devops_engineer_mid',
    jobRoleTitle: 'DevOps Engineer',
    jobRoleLevel: 'Mid',
    categoryName: 'DevOps',
    skills: ['Kubernetes', 'AWS/Azure', 'Monitoring', 'Security', 'Infrastructure as Code'],
    questionFields: ['DevOps', 'Infrastructure', 'Cloud'],
    questionTopics: ['Kubernetes', 'Cloud Platforms', 'Monitoring', 'Security', 'Infrastructure as Code'],
    questionLevels: ['middle'],
    aiContextKeywords: ['kubernetes', 'cloud platforms', 'monitoring', 'security', 'infrastructure as code'],
    interviewFocusAreas: ['Kubernetes orchestration', 'Cloud platform expertise', 'Monitoring systems', 'Security practices', 'Infrastructure automation']
  },

  'devops_engineer_senior': {
    jobRoleId: '',
    jobRoleKey: 'devops_engineer_senior',
    jobRoleTitle: 'DevOps Engineer',
    jobRoleLevel: 'Senior',
    categoryName: 'DevOps',
    skills: ['Architecture', 'Team Leadership', 'Strategy', 'Cost Optimization', 'Security'],
    questionFields: ['DevOps', 'Infrastructure', 'Cloud'],
    questionTopics: ['Architecture', 'Leadership', 'Strategy', 'Cost Optimization', 'Security'],
    questionLevels: ['senior'],
    aiContextKeywords: ['devops architecture', 'leadership', 'strategy', 'cost optimization', 'security'],
    interviewFocusAreas: ['DevOps architecture design', 'Team leadership', 'Strategic planning', 'Cost optimization', 'Security implementation']
  },

  // QA/Testing
  'qa_engineer_junior': {
    jobRoleId: '',
    jobRoleKey: 'qa_engineer_junior',
    jobRoleTitle: 'QA Engineer',
    jobRoleLevel: 'Junior',
    categoryName: 'QA',
    skills: ['Manual Testing', 'Test Cases', 'Bug Reporting', 'Selenium', 'Git'],
    questionFields: ['Quality Assurance', 'Testing', 'QA'],
    questionTopics: ['Manual Testing', 'Test Cases', 'Bug Reporting', 'Automation Basics'],
    questionLevels: ['junior'],
    aiContextKeywords: ['qa', 'testing', 'manual testing', 'test cases', 'bug reporting'],
    interviewFocusAreas: ['Manual testing techniques', 'Test case design', 'Bug reporting process', 'Basic automation']
  },

  'qa_engineer_mid': {
    jobRoleId: '',
    jobRoleKey: 'qa_engineer_mid',
    jobRoleTitle: 'QA Engineer',
    jobRoleLevel: 'Mid',
    categoryName: 'QA',
    skills: ['Automation', 'Selenium', 'API Testing', 'Performance Testing', 'Test Strategy'],
    questionFields: ['Quality Assurance', 'Testing', 'QA'],
    questionTopics: ['Automation', 'API Testing', 'Performance Testing', 'Test Strategy'],
    questionLevels: ['middle'],
    aiContextKeywords: ['automation', 'api testing', 'performance testing', 'test strategy', 'qa'],
    interviewFocusAreas: ['Test automation', 'API testing methodologies', 'Performance testing', 'Test strategy development']
  },

  'qa_engineer_senior': {
    jobRoleId: '',
    jobRoleKey: 'qa_engineer_senior',
    jobRoleTitle: 'QA Engineer',
    jobRoleLevel: 'Senior',
    categoryName: 'QA',
    skills: ['Test Architecture', 'Team Leadership', 'Process Improvement', 'Quality Strategy'],
    questionFields: ['Quality Assurance', 'Testing', 'QA'],
    questionTopics: ['Test Architecture', 'Leadership', 'Process Improvement', 'Quality Strategy'],
    questionLevels: ['senior'],
    aiContextKeywords: ['test architecture', 'leadership', 'process improvement', 'quality strategy'],
    interviewFocusAreas: ['Test architecture design', 'Team leadership', 'Process improvement', 'Quality strategy development']
  },

  // UI/UX Design
  'uiux_designer_junior': {
    jobRoleId: '',
    jobRoleKey: 'uiux_designer_junior',
    jobRoleTitle: 'UI/UX Designer',
    jobRoleLevel: 'Junior',
    categoryName: 'UI/UX',
    skills: ['Figma', 'Adobe Creative Suite', 'Design Principles', 'User Research', 'Prototyping'],
    questionFields: ['UI/UX Design', 'Design', 'User Experience'],
    questionTopics: ['Design Tools', 'Design Principles', 'User Research', 'Prototyping'],
    questionLevels: ['junior'],
    aiContextKeywords: ['ui/ux', 'design', 'figma', 'user research', 'prototyping'],
    interviewFocusAreas: ['Design tool proficiency', 'Design principles', 'User research methods', 'Prototyping skills']
  },

  'uiux_designer_mid': {
    jobRoleId: '',
    jobRoleKey: 'uiux_designer_mid',
    jobRoleTitle: 'UI/UX Designer',
    jobRoleLevel: 'Mid',
    categoryName: 'UI/UX',
    skills: ['Advanced Design', 'User Testing', 'Design Systems', 'Accessibility', 'Collaboration'],
    questionFields: ['UI/UX Design', 'Design', 'User Experience'],
    questionTopics: ['Advanced Design', 'User Testing', 'Design Systems', 'Accessibility'],
    questionLevels: ['middle'],
    aiContextKeywords: ['advanced design', 'user testing', 'design systems', 'accessibility', 'ui/ux'],
    interviewFocusAreas: ['Advanced design techniques', 'User testing methodologies', 'Design system creation', 'Accessibility standards']
  },

  'uiux_designer_senior': {
    jobRoleId: '',
    jobRoleKey: 'uiux_designer_senior',
    jobRoleTitle: 'UI/UX Designer',
    jobRoleLevel: 'Senior',
    categoryName: 'UI/UX',
    skills: ['Design Strategy', 'Team Leadership', 'Design Operations', 'Business Impact'],
    questionFields: ['UI/UX Design', 'Design', 'User Experience'],
    questionTopics: ['Design Strategy', 'Leadership', 'Design Operations', 'Business Impact'],
    questionLevels: ['senior'],
    aiContextKeywords: ['design strategy', 'leadership', 'design operations', 'business impact'],
    interviewFocusAreas: ['Design strategy development', 'Team leadership', 'Design operations management', 'Business impact measurement']
  }
};

/**
 * Mapping từ Question Bank sang Job Roles
 */
export const QUESTION_TO_JOB_ROLE_MAPPING: Record<string, QuestionBankMapping> = {
  'Frontend Development': {
    field: 'Frontend Development',
    topics: ['HTML/CSS', 'JavaScript', 'React', 'Vue', 'Angular', 'TypeScript', 'State Management', 'Performance', 'Testing'],
    levels: ['junior', 'middle', 'senior'],
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'State Management', 'Testing'],
    jobRoles: ['frontend_developer_junior', 'frontend_developer_mid', 'frontend_developer_senior', 'fullstack_developer_junior', 'fullstack_developer_mid', 'fullstack_developer_senior']
  },

  'Backend Development': {
    field: 'Backend Development',
    topics: ['Programming', 'Databases', 'APIs', 'System Design', 'Microservices', 'Caching', 'Message Queues'],
    levels: ['junior', 'middle', 'senior'],
    skills: ['Python', 'Java', 'Node.js', 'SQL', 'NoSQL', 'APIs', 'System Design'],
    jobRoles: ['backend_developer_junior', 'backend_developer_mid', 'backend_developer_senior', 'fullstack_developer_junior', 'fullstack_developer_mid', 'fullstack_developer_senior']
  },

  'Mobile Development': {
    field: 'Mobile Development',
    topics: ['React Native', 'Flutter', 'iOS', 'Android', 'Mobile UI', 'Performance', 'Testing'],
    levels: ['junior', 'middle', 'senior'],
    skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Mobile UI', 'Performance'],
    jobRoles: ['mobile_developer_junior', 'mobile_developer_mid', 'mobile_developer_senior']
  },

  'Data Science': {
    field: 'Data Science',
    topics: ['Python', 'Data Analysis', 'Statistics', 'Machine Learning', 'Deep Learning', 'Model Evaluation'],
    levels: ['junior', 'middle', 'senior'],
    skills: ['Python', 'Pandas', 'NumPy', 'Machine Learning', 'Statistics', 'SQL'],
    jobRoles: ['data_scientist_junior', 'data_scientist_mid', 'data_scientist_senior']
  },

  'DevOps': {
    field: 'DevOps',
    topics: ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'Cloud', 'Monitoring', 'Security'],
    levels: ['junior', 'middle', 'senior'],
    skills: ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'Cloud', 'Monitoring'],
    jobRoles: ['devops_engineer_junior', 'devops_engineer_mid', 'devops_engineer_senior']
  },

  'Quality Assurance': {
    field: 'Quality Assurance',
    topics: ['Manual Testing', 'Automation', 'API Testing', 'Performance Testing', 'Test Strategy'],
    levels: ['junior', 'middle', 'senior'],
    skills: ['Manual Testing', 'Selenium', 'API Testing', 'Performance Testing'],
    jobRoles: ['qa_engineer_junior', 'qa_engineer_mid', 'qa_engineer_senior']
  },

  'UI/UX Design': {
    field: 'UI/UX Design',
    topics: ['Design Tools', 'Design Principles', 'User Research', 'Prototyping', 'Design Systems'],
    levels: ['junior', 'middle', 'senior'],
    skills: ['Figma', 'Adobe Creative Suite', 'Design Principles', 'User Research'],
    jobRoles: ['uiux_designer_junior', 'uiux_designer_mid', 'uiux_designer_senior']
  }
};

/**
 * Tìm mapping cho job role dựa trên key
 */
export function findJobRoleMapping(jobRoleKey: string): JobRoleMapping | null {
  return JOB_ROLE_TO_QUESTION_MAPPING[jobRoleKey] || null;
}

/**
 * Tìm mapping cho job role dựa trên title và level
 */
export function findJobRoleMappingByTitleAndLevel(title: string, level: string): JobRoleMapping | null {
  const key = `${title.toLowerCase().replace(/\s+/g, '_')}_${level.toLowerCase()}`;
  return findJobRoleMapping(key);
}

/**
 * Tìm tất cả job roles phù hợp với question field
 */
export function findJobRolesByQuestionField(field: string): string[] {
  const mapping = QUESTION_TO_JOB_ROLE_MAPPING[field];
  return mapping ? mapping.jobRoles : [];
}

/**
 * Tạo AI context cho interview dựa trên job role
 */
export function createAIContextForJobRole(jobRoleMapping: JobRoleMapping): string {
  return `You are conducting a technical interview for a ${jobRoleMapping.jobRoleLevel} level ${jobRoleMapping.jobRoleTitle} position.

FOCUS AREAS:
${jobRoleMapping.interviewFocusAreas.map(area => `- ${area}`).join('\n')}

REQUIRED SKILLS:
${jobRoleMapping.skills.map(skill => `- ${skill}`).join('\n')}

KEYWORDS TO USE:
${jobRoleMapping.aiContextKeywords.join(', ')}

INTERVIEW GUIDELINES:
- Ask technical questions related to: ${jobRoleMapping.questionTopics.join(', ')}
- Focus on ${jobRoleMapping.jobRoleLevel} level complexity
- Cover areas: ${jobRoleMapping.interviewFocusAreas.join(', ')}
- Use natural, professional tone
- Provide constructive feedback
- Adapt questions based on candidate responses
- End with professional conclusion

Remember to maintain a professional but friendly tone throughout the interview.`;
}

/**
 * Tạo filter cho question bank dựa trên job role
 */
export function createQuestionFilterForJobRole(jobRoleMapping: JobRoleMapping): {
  fields: string[];
  topics: string[];
  levels: string[];
} {
  return {
    fields: jobRoleMapping.questionFields,
    topics: jobRoleMapping.questionTopics,
    levels: jobRoleMapping.questionLevels
  };
}

/**
 * Validate mapping giữa job role và question bank
 */
export function validateJobRoleQuestionMapping(): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check if all job role mappings have valid question fields
  Object.entries(JOB_ROLE_TO_QUESTION_MAPPING).forEach(([key, mapping]) => {
    if (mapping.questionFields.length === 0) {
      issues.push(`Job role ${key} has no question fields`);
    }
    if (mapping.questionTopics.length === 0) {
      issues.push(`Job role ${key} has no question topics`);
    }
    if (mapping.questionLevels.length === 0) {
      issues.push(`Job role ${key} has no question levels`);
    }
  });

  // Check if all question mappings have valid job roles
  Object.entries(QUESTION_TO_JOB_ROLE_MAPPING).forEach(([field, mapping]) => {
    if (mapping.jobRoles.length === 0) {
      issues.push(`Question field ${field} has no job roles`);
    }
  });

  return {
    valid: issues.length === 0,
    issues
  };
}

