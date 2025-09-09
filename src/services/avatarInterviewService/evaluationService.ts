import { ChatMessage, callOpenAI } from '../openaiService';
import { InterviewEvaluation, QuestionAnalysis } from './Avatar-AI';

// Detailed evaluation criteria by position and level
interface EvaluationCriteria {
  position: string;
  level: string;
  technicalWeight: number;
  skillRequirements: {
    technical: string[];
    soft: string[];
    experience: string[];
  };
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  benchmarks: {
    junior: { technical: number; experience: number; leadership: number };
    mid: { technical: number; experience: number; leadership: number };
    senior: { technical: number; experience: number; leadership: number };
  };
}

const EVALUATION_CRITERIA: Record<string, EvaluationCriteria> = {
  "Frontend": {
    position: "Frontend Developer",
    level: "all",
    technicalWeight: 0.7,
    skillRequirements: {
      technical: [
        "HTML/CSS proficiency",
        "JavaScript/TypeScript knowledge", 
        "Frontend frameworks (React, Vue, Angular)",
        "State management",
        "Build tools and bundlers",
        "Browser APIs and performance",
        "Responsive design",
        "Testing practices",
        "Accessibility standards",
        "UI/UX understanding"
      ],
      soft: [
        "Communication clarity",
        "Problem-solving approach",
        "Attention to detail",
        "User empathy",
        "Design collaboration",
        "Learning agility"
      ],
      experience: [
        "Real project examples",
        "Code organization",
        "Performance optimization",
        "Cross-browser compatibility",
        "Team collaboration"
      ]
    },
    salaryRange: { min: 12000000, max: 45000000, currency: "VND" },
    benchmarks: {
      junior: { technical: 6, experience: 4, leadership: 2 },
      mid: { technical: 7.5, experience: 7, leadership: 5 },
      senior: { technical: 8.5, experience: 8.5, leadership: 8 }
    }
  },
  "Backend": {
    position: "Backend Developer", 
    level: "all",
    technicalWeight: 0.8,
    skillRequirements: {
      technical: [
        "Server-side programming languages",
        "Database design and optimization",
        "API development (REST, GraphQL)",
        "System architecture understanding",
        "Security best practices",
        "Performance optimization",
        "Caching strategies",
        "Message queues",
        "Microservices architecture",
        "DevOps fundamentals"
      ],
      soft: [
        "Analytical thinking",
        "Problem decomposition",
        "Documentation skills",
        "System thinking",
        "Risk assessment",
        "Communication with stakeholders"
      ],
      experience: [
        "Scalable system design",
        "Database performance tuning",
        "API design patterns",
        "Security implementation",
        "Production troubleshooting"
      ]
    },
    salaryRange: { min: 15000000, max: 50000000, currency: "VND" },
    benchmarks: {
      junior: { technical: 6.5, experience: 4, leadership: 2 },
      mid: { technical: 8, experience: 7.5, leadership: 5 },
      senior: { technical: 9, experience: 9, leadership: 8.5 }
    }
  },
  "Full Stack": {
    position: "Full Stack Developer",
    level: "all", 
    technicalWeight: 0.75,
    skillRequirements: {
      technical: [
        "Frontend technologies proficiency",
        "Backend development skills",
        "Database management",
        "API integration",
        "System architecture",
        "DevOps understanding",
        "Testing across stack",
        "Security implementation",
        "Performance optimization",
        "Technology integration"
      ],
      soft: [
        "Versatility and adaptability",
        "Project management",
        "Cross-functional communication",
        "Problem-solving across domains",
        "Learning agility",
        "Technical leadership"
      ],
      experience: [
        "End-to-end development",
        "Technology stack decisions",
        "Integration challenges",
        "Performance across layers",
        "Team collaboration"
      ]
    },
    salaryRange: { min: 18000000, max: 55000000, currency: "VND" },
    benchmarks: {
      junior: { technical: 6, experience: 4.5, leadership: 3 },
      mid: { technical: 7.5, experience: 7.5, leadership: 6 },
      senior: { technical: 8.5, experience: 9, leadership: 8.5 }
    }
  }
};

function getLevelBenchmark(level: string): 'junior' | 'mid' | 'senior' {
  const normalizedLevel = level.toLowerCase();
  if (normalizedLevel.includes('junior') || normalizedLevel.includes('fresher')) return 'junior';
  if (normalizedLevel.includes('senior') || normalizedLevel.includes('lead')) return 'senior';
  return 'mid';
}

function getSalaryRange(position: string, level: string): { min: number; max: number; currency: string } {
  const criteria = EVALUATION_CRITERIA[position] || EVALUATION_CRITERIA["Full Stack"];
  const levelBenchmark = getLevelBenchmark(level);
  
  const baseRange = criteria.salaryRange;
  const multipliers = {
    junior: { min: 0.6, max: 0.8 },
    mid: { min: 0.8, max: 1.0 },
    senior: { min: 1.0, max: 1.3 }
  };
  
  const multiplier = multipliers[levelBenchmark];
  return {
    min: Math.round(baseRange.min * multiplier.min),
    max: Math.round(baseRange.max * multiplier.max),
    currency: baseRange.currency
  };
}

// Function to extract Q&A pairs from conversation
function extractQuestionAnswerPairs(conversation: ChatMessage[]): Array<{question: string, answer: string}> {
  const pairs: Array<{question: string, answer: string}> = [];
  
  for (let i = 0; i < conversation.length - 1; i++) {
    const currentMsg = conversation[i];
    const nextMsg = conversation[i + 1];
    
    // Look for AI asking a question followed by user answering
    if (currentMsg.role === 'assistant' && nextMsg.role === 'user') {
      // Extract the question (remove any system-like prefixes)
      let question = currentMsg.content.trim();
      if (question.startsWith('INSTRUCTION:')) continue;
      
      // Clean up the question
      question = question.replace(/^(Question \d+[:.]?\s*)/i, '');
      
      const answer = nextMsg.content.trim();
      
      if (question && answer && question.length > 10 && answer.length > 5) {
        pairs.push({ question, answer });
      }
    }
  }
  
  return pairs;
}

// Function to generate detailed analysis for a single question-answer pair
async function analyzeQuestionAnswer(
  question: string,
  answer: string,
  field: string,
  level: string,
  language: 'vi-VN' | 'en-US' | 'zh-CN' | 'ja-JP' | 'ko-KR'
): Promise<QuestionAnalysis> {
  const prompt = `You are evaluating a candidate's answer for a ${field} position at ${level} level.

QUESTION: ${question}
ANSWER: ${answer}

Please provide a detailed analysis of this answer. Consider:
1. Technical accuracy and depth
2. Completeness of the response
3. Clarity of communication
4. Relevant strengths and weaknesses
5. Specific suggestions for improvement
6. Key technical terms and concepts mentioned
7. Skills demonstrated

Respond in ${language === 'vi-VN' ? 'Vietnamese' : language === 'zh-CN' ? 'Chinese' : language === 'ja-JP' ? 'Japanese' : language === 'ko-KR' ? 'Korean' : 'English'}.

REQUIRED JSON FORMAT:
{
  "score": number (1-10, overall quality),
  "technicalAccuracy": number (1-10, technical correctness),
  "completeness": number (1-10, how complete the answer is),
  "clarity": number (1-10, communication clarity),
  "strengths": string[] (specific strengths in the answer),
  "weaknesses": string[] (areas that need improvement),
  "suggestions": string[] (specific suggestions for improvement),
  "keywords": string[] (key technical terms/concepts mentioned),
  "skillTags": string[] (skills demonstrated in this answer),
  "category": string (question category: technical, behavioral, problem-solving, etc.),
  "feedback": string (detailed written feedback)
}`;

  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: prompt },
      { role: 'user', content: `Analyze this Q&A pair for a ${field} ${level} position.` }
    ];

    const response = await callOpenAI(messages);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response from AI');
    }

    let content = response.choices[0].message.content.trim();
    
    // Remove markdown formatting if present
    if (content.startsWith('```json')) {
      content = content.replace(/```json\n?/, '').replace(/```\n?/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/```\n?/, '').replace(/```\n?/, '');
    }

    const analysis = JSON.parse(content);
    
    return {
      question,
      userAnswer: answer,
      score: validateScore(analysis.score),
      technicalAccuracy: validateScore(analysis.technicalAccuracy),
      completeness: validateScore(analysis.completeness),
      clarity: validateScore(analysis.clarity),
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
      keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
      skillTags: Array.isArray(analysis.skillTags) ? analysis.skillTags : [],
      category: analysis.category || 'general',
      feedback: analysis.feedback || ''
    };
  } catch (error) {
    console.error('Error analyzing question-answer pair:', error);
    
    // Return default analysis
    return {
      question,
      userAnswer: answer,
      score: 5,
      technicalAccuracy: 5,
      completeness: 5,
      clarity: 5,
      strengths: [],
      weaknesses: [],
      suggestions: [],
      keywords: [],
      skillTags: [],
      category: 'general',
      feedback: language === 'vi-VN' 
        ? 'Không thể phân tích câu trả lời này.' 
        : language === 'zh-CN'
        ? '无法分析此答案。'
        : language === 'ja-JP'
        ? 'この回答を分析できません。'
        : language === 'ko-KR'
        ? '이 답변을 분석할 수 없습니다.'
        : 'Unable to analyze this answer.'
    };
  }
}

export async function generateInterviewEvaluation(
  conversation: ChatMessage[],
  field: string,
  level: string,
  language: 'vi-VN' | 'en-US' | 'zh-CN' | 'ja-JP' | 'ko-KR'
): Promise<InterviewEvaluation> {
  try {
    // Use the provided level parameter instead of extracting from conversation
    const criteria = EVALUATION_CRITERIA[field] || EVALUATION_CRITERIA["Full Stack"];
    const levelBenchmark = getLevelBenchmark(level);
    const benchmarks = criteria.benchmarks[levelBenchmark];
    const salaryRange = getSalaryRange(field, level);

    // Extract Q&A pairs for detailed analysis
    const questionAnswerPairs = extractQuestionAnswerPairs(conversation);
    
    // Generate detailed analysis for each Q&A pair
    const questionAnalysisPromises = questionAnswerPairs.map(pair => 
      analyzeQuestionAnswer(pair.question, pair.answer, field, level, language)
    );
    
    // Wait for all question analyses to complete
    const questionAnalysis = await Promise.all(questionAnalysisPromises);

    const prompt = `You are a senior technical interviewer specializing in ${field} positions. 
You are evaluating a candidate for a ${level} ${field} developer role.

EVALUATION FRAMEWORK:
Position: ${criteria.position}
Level: ${level}
Technical Weight: ${criteria.technicalWeight * 100}%

TECHNICAL REQUIREMENTS FOR ${field.toUpperCase()}:
${criteria.skillRequirements.technical.map(skill => `- ${skill}`).join('\n')}

SOFT SKILLS REQUIREMENTS:
${criteria.skillRequirements.soft.map(skill => `- ${skill}`).join('\n')}

EXPERIENCE EXPECTATIONS:
${criteria.skillRequirements.experience.map(exp => `- ${exp}`).join('\n')}

BENCHMARK SCORES FOR ${level.toUpperCase()} LEVEL:
- Technical Competency: ${benchmarks.technical}/10 (minimum expected)
- Experience Level: ${benchmarks.experience}/10 (minimum expected)  
- Leadership/Collaboration: ${benchmarks.leadership}/10 (minimum expected)

EVALUATION INSTRUCTIONS:
1. Analyze the conversation thoroughly for technical depth, accuracy, and breadth
2. Assess communication clarity, problem-solving approach, and delivery/presentation quality
3. Compare against ${level} level expectations for ${field}
4. Consider real-world application and practical knowledge
5. Evaluate learning potential and growth mindset

SCORING GUIDELINES:
- 8-10: Exceeds expectations for ${level} level
- 6-7: Meets expectations for ${level} level  
- 4-5: Below expectations, may need development
- 1-3: Significantly below expectations

HIRING RECOMMENDATIONS:
- strong_hire: Exceptional candidate, significantly exceeds expectations
- hire: Good candidate, meets or exceeds most expectations
- consider: Mixed results, some concerns but potential upside
- reject: Does not meet minimum requirements for ${level} level

Please respond in ${language === 'vi-VN' ? 'Vietnamese' : language === 'zh-CN' ? 'Chinese' : language === 'ja-JP' ? 'Japanese' : language === 'ko-KR' ? 'Korean' : 'English'} with detailed analysis.

REQUIRED JSON FORMAT:
{
  "technicalScore": number (1-10, weighted heavily for technical roles),
  "communicationScore": number (1-10),
  "problemSolvingScore": number (1-10),
  "deliveryScore": number (1-10),
  "technicalStrengths": string[] (specific technical strengths observed),
  "technicalWeaknesses": string[] (areas needing improvement),
  "recommendations": string[] (actionable development suggestions),
  "hiringRecommendation": "strong_hire" | "hire" | "consider" | "reject",
  "detailedFeedback": {
    "technical": string (detailed technical assessment),
    "softSkills": string (communication, collaboration, problem-solving),
    "experience": string (practical knowledge and real-world application),
    "potential": string (growth potential and learning ability)
  },
  "salary_range": {
    "min": ${salaryRange.min},
    "max": ${salaryRange.max}, 
    "currency": "${salaryRange.currency}"
  },
  "levelAssessment": {
    "currentLevel": string (assessed level based on performance),
    "readinessForNextLevel": boolean,
    "gapAnalysis": string[] (skills needed for advancement)
  }
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: prompt },
      { role: 'user', content: `Please evaluate this ${field} interview conversation:` },
      ...conversation
    ];

    const response = await callOpenAI(messages);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response from AI');
    }

    let content = response.choices[0].message.content.trim();
    
    // Remove any markdown formatting if present
    if (content.startsWith('```json')) {
      content = content.replace(/```json\n?/, '').replace(/```\n?/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/```\n?/, '').replace(/```\n?/, '');
    }

    let evaluation;
    try {
      evaluation = JSON.parse(content);
    } catch {
      console.warn('AI returned non-JSON response, using enhanced default evaluation');
      return generateDefaultEvaluation(field, level, language, salaryRange);
    }

    // Ensure all required fields are present and valid
    const validatedEvaluation: InterviewEvaluation = {
      technicalScore: validateScore(evaluation.technicalScore),
      communicationScore: validateScore(evaluation.communicationScore),
      problemSolvingScore: validateScore(evaluation.problemSolvingScore),
      deliveryScore: validateScore((evaluation as Partial<{ deliveryScore: unknown }>).deliveryScore),
      // overallRating được tính toán ở backend dựa trên 4 tiêu chí
      technicalStrengths: Array.isArray(evaluation.technicalStrengths) ? evaluation.technicalStrengths : [],
      technicalWeaknesses: Array.isArray(evaluation.technicalWeaknesses) ? evaluation.technicalWeaknesses : [],
      recommendations: Array.isArray(evaluation.recommendations) ? evaluation.recommendations : [],
      hiringRecommendation: ['strong_hire', 'hire', 'consider', 'reject'].includes(evaluation.hiringRecommendation) 
        ? evaluation.hiringRecommendation 
        : 'consider',
      detailedFeedback: {
        technical: evaluation.detailedFeedback?.technical || (language === 'vi-VN' ? 'Cần đánh giá thêm' : language === 'zh-CN' ? '需要进一步评估' : language === 'ja-JP' ? 'さらなる評価が必要' : language === 'ko-KR' ? '추가 평가 필요' : 'Needs further assessment'),
        softSkills: evaluation.detailedFeedback?.softSkills || (language === 'vi-VN' ? 'Cần đánh giá thêm' : language === 'zh-CN' ? '需要进一步评估' : language === 'ja-JP' ? 'さらなる評価が必要' : language === 'ko-KR' ? '추가 평가 필요' : 'Needs further assessment'),
        experience: evaluation.detailedFeedback?.experience || (language === 'vi-VN' ? 'Cần đánh giá thêm' : language === 'zh-CN' ? '需要进一步评估' : language === 'ja-JP' ? 'さらなる評価が必要' : language === 'ko-KR' ? '추가 평가 필요' : 'Needs further assessment'),
        potential: evaluation.detailedFeedback?.potential || (language === 'vi-VN' ? 'Cần đánh giá thêm' : language === 'zh-CN' ? '需要进一步评估' : language === 'ja-JP' ? 'さらなる評価が必要' : language === 'ko-KR' ? '추가 평가 필요' : 'Needs further assessment')
      },
      salary_range: {
        min: evaluation.salary_range?.min || salaryRange.min,
        max: evaluation.salary_range?.max || salaryRange.max,
        currency: evaluation.salary_range?.currency || salaryRange.currency
      },
      levelAssessment: evaluation.levelAssessment ? {
        currentLevel: evaluation.levelAssessment.currentLevel || level,
        readinessForNextLevel: Boolean(evaluation.levelAssessment.readinessForNextLevel),
        gapAnalysis: Array.isArray(evaluation.levelAssessment.gapAnalysis) ? evaluation.levelAssessment.gapAnalysis : []
      } : undefined,
      questionAnalysis: questionAnalysis
    };
    
    return validatedEvaluation;
  } catch (error) {
    console.error('Error generating interview evaluation:', error);
    
    // Use the provided level parameter for error case
    const defaultSalaryRange = getSalaryRange(field, level);
    return generateDefaultEvaluation(field, level, language, defaultSalaryRange);
  }
}

function validateScore(score: unknown): number {
  const numScore = Number(score);
  if (isNaN(numScore) || numScore < 1 || numScore > 10) {
    return 5; // Default middle score
  }
  return Math.round(numScore);
}

function generateDefaultEvaluation(
  field: string, 
  level: string, 
  language: 'vi-VN' | 'en-US' | 'zh-CN' | 'ja-JP' | 'ko-KR',
  salaryRange: { min: number; max: number; currency: string }
): InterviewEvaluation {
  const criteria = EVALUATION_CRITERIA[field] || EVALUATION_CRITERIA["Full Stack"];
  const levelBenchmark = getLevelBenchmark(level);
  const benchmarks = criteria.benchmarks[levelBenchmark];
  
  return {
    technicalScore: benchmarks.technical,
    communicationScore: 6,
    problemSolvingScore: 6,
    deliveryScore: 6,
    // overallRating được tính toán ở backend dựa trên 4 tiêu chí
    technicalStrengths: [
      language === 'vi-VN' ? `Kiến thức cơ bản về ${field}` 
        : language === 'zh-CN' ? `${field}的基础知识`
        : language === 'ja-JP' ? `${field}の基礎知識`
        : language === 'ko-KR' ? `${field} 기본 지식`
        : `Basic knowledge of ${field}`,
      language === 'vi-VN' ? 'Tiềm năng phát triển' 
        : language === 'zh-CN' ? '发展潜力'
        : language === 'ja-JP' ? '成長の可能性'
        : language === 'ko-KR' ? '성장 잠재력'
        : 'Development potential'
    ],
    technicalWeaknesses: [
      language === 'vi-VN' ? 'Cần đánh giá kỹ thuật chi tiết hơn' 
        : language === 'zh-CN' ? '需要更详细的技术评估'
        : language === 'ja-JP' ? 'より詳細な技術評価が必要'
        : language === 'ko-KR' ? '더 상세한 기술 평가 필요'
        : 'Needs more detailed technical assessment',
      language === 'vi-VN' ? 'Thiếu thông tin về kinh nghiệm thực tế' 
        : language === 'zh-CN' ? '缺乏实际经验信息'
        : language === 'ja-JP' ? '実務経験に関する情報が不足'
        : language === 'ko-KR' ? '실무 경험 정보 부족'
        : 'Limited information on practical experience'
    ],
    recommendations: [
      language === 'vi-VN' ? `Tiến hành phỏng vấn kỹ thuật sâu hơn về ${field}` 
        : language === 'zh-CN' ? `进行更深入的${field}技术面试`
        : language === 'ja-JP' ? `${field}に関するより深い技術面接を実施`
        : language === 'ko-KR' ? `${field}에 대한 더 깊은 기술 면접 진행`
        : `Conduct deeper technical interview on ${field}`,
      language === 'vi-VN' ? 'Đánh giá qua bài tập thực tế' 
        : language === 'zh-CN' ? '通过实际作业进行评估'
        : language === 'ja-JP' ? '実践的な課題を通じて評価'
        : language === 'ko-KR' ? '실무 과제를 통한 평가'
        : 'Evaluate through practical assignments',
      language === 'vi-VN' ? 'Kiểm tra portfolio và dự án cá nhân' 
        : language === 'zh-CN' ? '检查作品集和个人项目'
        : language === 'ja-JP' ? 'ポートフォリオと個人プロジェクトの確認'
        : language === 'ko-KR' ? '포트폴리오 및 개인 프로젝트 검토'
        : 'Review portfolio and personal projects'
    ],
    hiringRecommendation: 'consider' as const,
    detailedFeedback: {
      technical: language === 'vi-VN' 
        ? `Ứng viên cho thấy hiểu biết cơ bản về ${field}. Cần đánh giá sâu hơn về kinh nghiệm thực tế và khả năng áp dụng kiến thức vào dự án thực tế.`
        : language === 'zh-CN'
        ? `候选人表现出对${field}的基本理解。需要进一步评估实际经验和将知识应用到实际项目的能力。`
        : language === 'ja-JP'
        ? `候補者は${field}の基本的な理解を示している。実務経験と知識を実際のプロジェクトに適用する能力について、さらなる評価が必要。`
        : language === 'ko-KR'
        ? `후보자는 ${field}에 대한 기본적인 이해를 보여줍니다. 실제 경험과 지식을 실제 프로젝트에 적용하는 능력에 대한 추가 평가가 필요합니다.`
        : `Candidate shows basic understanding of ${field}. Further assessment needed on practical experience and ability to apply knowledge to real projects.`,
      softSkills: language === 'vi-VN'
        ? 'Khả năng giao tiếp ở mức trung bình. Cần đánh giá thêm về kỹ năng làm việc nhóm và giải quyết vấn đề.'
        : language === 'zh-CN'
        ? '沟通能力处于中等水平。需要进一步评估团队合作和问题解决技能。'
        : language === 'ja-JP'
        ? 'コミュニケーション能力は平均レベル。チームワークと問題解決スキルについて追加評価が必要。'
        : language === 'ko-KR'
        ? '의사소통 능력은 평균 수준입니다. 팀워크와 문제 해결 기술에 대한 추가 평가가 필요합니다.'
        : 'Communication skills at average level. Additional assessment needed on teamwork and problem-solving skills.',
      experience: language === 'vi-VN'
        ? `Kinh nghiệm ${level} cần được xác minh qua các dự án cụ thể và thử thách kỹ thuật.`
        : language === 'zh-CN'
        ? `${level}经验需要通过具体项目和技术挑战进行验证。`
        : language === 'ja-JP'
        ? `${level}経験は具体的なプロジェクトと技術的課題を通じて確認する必要がある。`
        : language === 'ko-KR'
        ? `${level} 경험은 구체적인 프로젝트와 기술적 도전을 통해 검증해야 합니다.`
        : `${level} experience needs verification through specific projects and technical challenges.`,
      potential: language === 'vi-VN'
        ? 'Cho thấy tiềm năng học hỏi và phát triển. Nên đầu tư thời gian đào tạo và hỗ trợ.'
        : language === 'zh-CN'
        ? '显示出学习和发展的潜力。应该投入培训和支持时间。'
        : language === 'ja-JP'
        ? '学習と成長の可能性を示している。トレーニングとサポートに時間を投資すべき。'
        : language === 'ko-KR'
        ? '학습과 성장의 잠재력을 보여줍니다. 훈련과 지원에 시간을 투자해야 합니다.'
        : 'Shows learning potential and development capability. Should invest in training and support.'
    },
    salary_range: salaryRange,
    levelAssessment: {
      currentLevel: levelBenchmark,
      readinessForNextLevel: false,
      gapAnalysis: [
        language === 'vi-VN' ? `Cần cải thiện kiến thức chuyên sâu về ${field}` 
          : language === 'zh-CN' ? `需要改进${field}的深入知识`
          : language === 'ja-JP' ? `${field}の深い知識を改善する必要がある`
          : language === 'ko-KR' ? `${field}에 대한 깊은 지식 개선 필요`
          : `Need to improve deep knowledge of ${field}`,
        language === 'vi-VN' ? 'Tăng cường kinh nghiệm thực tế' 
          : language === 'zh-CN' ? '加强实际经验'
          : language === 'ja-JP' ? '実務経験の強化'
          : language === 'ko-KR' ? '실무 경험 강화'
          : 'Strengthen practical experience',
        language === 'vi-VN' ? 'Phát triển kỹ năng giao tiếp kỹ thuật' 
          : language === 'zh-CN' ? '发展技术沟通技能'
          : language === 'ja-JP' ? '技術コミュニケーションスキルの開発'
          : language === 'ko-KR' ? '기술 커뮤니케이션 기술 개발'
          : 'Develop technical communication skills'
      ]
    },
    questionAnalysis: [] // No question analysis for default evaluation
  };
}
