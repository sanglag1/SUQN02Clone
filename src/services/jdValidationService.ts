export interface JDValidationResult {
  isValidJD: boolean;
  confidence: number;
  reasons: string[];
  detectedSections: string[];
  missingCriticalSections: string[];
}

export class JDValidationService {
  // Các từ khóa bắt buộc phải có trong JD (mở rộng cho tất cả ngành IT)
  private static readonly REQUIRED_KEYWORDS = [
    // Job-related terms
    'job', 'position', 'role', 'career', 'employment', 'work', 'vacancy', 'opportunity',
    'company', 'organization', 'team', 'department', 'business', 'enterprise',
    
    // Responsibility terms
    'responsibility', 'responsibilities', 'duties', 'tasks', 'accountable',
    'requirements', 'qualifications', 'skills', 'competencies', 'abilities',
    'experience', 'years of experience', 'minimum', 'background', 'knowledge',
    
    // Common JD sections
    'description', 'requirements', 'qualifications', 'candidate', 'applicant',
    'benefits', 'salary', 'compensation', 'package', 'offer', 'join us', 'apply',
    
    // IT-specific terms (broad coverage)
    'technology', 'technical', 'system', 'software', 'information technology', 'it',
    'application', 'platform', 'solution', 'project', 'digital', 'computer',
    'analysis', 'design', 'development', 'implementation', 'consultation',
    'support', 'maintenance', 'testing', 'quality', 'process', 'workflow',
    'user', 'client', 'customer', 'business', 'stakeholder', 'management'
  ];

  // Các section phổ biến trong JD
  private static readonly COMMON_JD_SECTIONS = [
    'job title', 'job description', 'position', 'role',
    'responsibilities', 'duties', 'requirements', 'qualifications',
    'skills required', 'experience', 'education', 'background',
    'benefits', 'salary', 'compensation', 'package',
    'about company', 'about us', 'company overview',
    'what you will do', 'what we offer', 'preferred qualifications'
  ];

  // Từ khóa kỹ thuật phổ biến cho tất cả ngành IT
  private static readonly TECH_KEYWORDS = [
    // Programming & Development
    'javascript', 'python', 'java', 'react', 'angular', 'vue',
    'node.js', 'nodejs', 'express', 'mongodb', 'mysql', 'postgresql',
    'html', 'css', 'typescript', 'php', 'c++', 'c#', 'go', 'rust',
    'frontend', 'backend', 'fullstack', 'full-stack', 'mobile',
    'ios', 'android', 'react native', 'flutter', 'development',
    
    // Cloud & Infrastructure
    'aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes',
    'api', 'rest', 'graphql', 'microservices',
    'devops', 'ci/cd', 'jenkins', 'gitlab', 'github', 'git',
    
    // Testing & QA
    'testing', 'qa', 'quality assurance', 'automation testing',
    'manual testing', 'test cases', 'test plans', 'bug tracking',
    'selenium', 'postman', 'jira', 'test automation',
    'performance testing', 'load testing', 'regression testing',
    'unit testing', 'integration testing', 'system testing',
    'test strategy', 'test execution', 'defect management',
    
    // Design & UX/UI
    'ui', 'ux', 'user interface', 'user experience', 'design',
    'figma', 'sketch', 'adobe', 'photoshop', 'illustrator',
    'wireframes', 'prototyping', 'user research', 'usability',
    'visual design', 'interaction design', 'design systems',
    'responsive design', 'mobile design', 'web design',
    
    // Data & Analytics
    'data', 'analytics', 'sql', 'database', 'data warehouse',
    'big data', 'machine learning', 'ai', 'artificial intelligence',
    'data science', 'business intelligence', 'tableau', 'power bi',
    'excel', 'reporting', 'kpi', 'metrics', 'dashboard',
    
    // Project Management & BA
    'project management', 'scrum', 'agile', 'kanban', 'sprint',
    'product owner', 'business analyst', 'requirements',
    'stakeholder', 'roadmap', 'backlog', 'user stories',
    'pmp', 'prince2', 'jira', 'confluence', 'trello',
    'business requirements', 'functional requirements',
    'process improvement', 'business process', 'workflow',
    
    // IT Support & Infrastructure
    'it support', 'helpdesk', 'technical support', 'troubleshooting',
    'network', 'server', 'windows', 'linux', 'active directory',
    'vmware', 'virtualization', 'backup', 'security',
    'firewall', 'monitoring', 'system administration',
    'hardware', 'software installation', 'end user support',
    
    // Security
    'cybersecurity', 'information security', 'penetration testing',
    'vulnerability assessment', 'security audit', 'compliance',
    'iso 27001', 'gdpr', 'encryption', 'risk assessment',
    
    // Sales & Marketing Tech
    'crm', 'salesforce', 'hubspot', 'marketing automation',
    'seo', 'sem', 'digital marketing', 'social media',
    'google analytics', 'conversion optimization',
    
    // General IT Terms
    'information technology', 'computer systems', 'enterprise software',
    'business systems', 'erp', 'saas', 'cloud computing',
    'digital transformation', 'automation', 'integration',
    'documentation', 'technical writing', 'user training',
    'vendor management', 'procurement', 'budget', 'governance'
  ];

  // Từ khóa blacklist (không phải JD)
  private static readonly BLACKLIST_KEYWORDS = [
    // Academic documents
    'abstract', 'conclusion', 'methodology', 'bibliography', 'citations',
    'research paper', 'thesis', 'dissertation', 'journal', 'publication',
    
    // Legal documents
    'whereas', 'hereby', 'aforementioned', 'jurisdiction',
    'contract', 'agreement', 'terms and conditions', 'legal notice',
    
    // Financial documents
    'balance sheet', 'income statement', 'cash flow',
    'assets', 'liabilities', 'equity', 'financial report',
    
    // Personal documents (CV/Resume)
    'curriculum vitae', 'resume', 'cv', 'personal statement',
    'dear sir/madam', 'sincerely yours', 'cover letter',
    'references available', 'portfolio', 'objective statement'
  ];

  // Validate nội dung có phải JD không
  static validateJD(text: string): JDValidationResult {
    const normalizedText = text.toLowerCase();
    const words = normalizedText.split(/\s+/);
    const wordCount = words.length;    // Kiểm tra độ dài tối thiểu
    if (wordCount < 50) {
      return {
        isValidJD: false,
        confidence: 0,
        reasons: ['Document too short to be a job description (minimum 50 words)'],
        detectedSections: [],
        missingCriticalSections: this.COMMON_JD_SECTIONS.slice(0, 5)
      };
    }

    let confidence = 0;
    const reasons: string[] = [];
    const detectedSections: string[] = [];
    const missingCriticalSections: string[] = [];    // 1. Kiểm tra từ khóa bắt buộc (35% weight)
    const foundRequiredKeywords = this.REQUIRED_KEYWORDS.filter(keyword => 
      normalizedText.includes(keyword)
    );
    
    const requiredKeywordRatio = foundRequiredKeywords.length / this.REQUIRED_KEYWORDS.length;
    const keywordScore = Math.min(requiredKeywordRatio * 70, 35); // Adjusted multiplier
    confidence += keywordScore;

    if (foundRequiredKeywords.length >= 5) {
      reasons.push(`Contains ${foundRequiredKeywords.length} job-related keywords`);
    } else if (foundRequiredKeywords.length >= 3) {
      reasons.push(` Contains ${foundRequiredKeywords.length} job-related keywords (acceptable)`);
    } else {
      reasons.push(` Missing critical job-related keywords (found only ${foundRequiredKeywords.length})`);
    }    // 2. Kiểm tra các section phổ biến trong JD (25% weight)
    const foundSections = this.COMMON_JD_SECTIONS.filter(section => 
      normalizedText.includes(section)
    );
    
    foundSections.forEach(section => detectedSections.push(section));
    
    const sectionRatio = foundSections.length / this.COMMON_JD_SECTIONS.length;
    const sectionScore = Math.min(sectionRatio * 50, 25); // Increased multiplier for better scoring
    confidence += sectionScore;

    if (foundSections.length >= 2) {
      reasons.push(`Contains typical JD sections: ${foundSections.slice(0, 3).join(', ')}`);
    } else if (foundSections.length >= 1) {
      reasons.push(`Contains some JD sections: ${foundSections.join(', ')}`);
    } else {
      reasons.push(`Missing typical JD sections`);
      this.COMMON_JD_SECTIONS.forEach(section => {
        if (!foundSections.includes(section) && missingCriticalSections.length < 5) {
          missingCriticalSections.push(section);
        }
      });
    }    // 3. Kiểm tra từ khóa kỹ thuật/IT (25% weight - flexible scoring)
    const foundTechKeywords = this.TECH_KEYWORDS.filter(keyword => 
      normalizedText.includes(keyword)
    );
    
    if (foundTechKeywords.length > 0) {
      const techScore = Math.min(foundTechKeywords.length * 1.5, 25); // Moderate multiplier
      confidence += techScore;
      reasons.push(`Contains IT/technical keywords: ${foundTechKeywords.slice(0, 3).join(', ')}`);
    } else {
      // For general IT roles without specific tech keywords, still give some points if other criteria are met
      if (foundRequiredKeywords.length >= 3 && foundSections.length >= 1) {
        confidence += 10; // Partial credit for general IT role
        reasons.push(`General IT role - no specific technical keywords but meets basic JD criteria`);
      } else {
        reasons.push(`No technical keywords found - may be general IT or administrative role`);
      }
    }    // 4. Kiểm tra cấu trúc văn bản (15% weight)
    const hasStructure = this.checkDocumentStructure(normalizedText);
    if (hasStructure) {
      confidence += 15;
      reasons.push('Document has proper structure');
    } else {
      reasons.push('Document lacks clear structure');
    }

    // 5. Kiểm tra blacklist (penalty)
    const blacklistScore = this.checkBlacklist(normalizedText);
    confidence -= blacklistScore;
    
    if (blacklistScore > 0) {
      reasons.push('Contains content not typical of job descriptions');
    }

    // 6. Kiểm tra các patterns đặc trưng của JD
    const jdPatterns = this.checkJDPatterns(normalizedText);
    confidence += jdPatterns;    // Đảm bảo confidence trong khoảng 0-100
    confidence = Math.max(0, Math.min(100, confidence));

    // Giảm ngưỡng xuống 35% cho flexible hơn với all IT roles
    let isValidJD = confidence >= 35;
    
    // Logic đặc biệt: Nếu có ít nhất điều kiện sau thì accept ngay cả khi confidence thấp:
    const hasJobKeywords = foundRequiredKeywords.length >= 3; // Flexible threshold
    const hasJDSections = foundSections.length >= 1; // At least 1 JD section
    const hasTechKeywords = foundTechKeywords.length >= 1;
    const hasGoodStructure = this.checkDocumentStructure(normalizedText);
    
    const positiveIndicators = [hasJobKeywords, hasJDSections, hasTechKeywords, hasGoodStructure]
      .filter(Boolean).length;
    
    // Nếu có ít nhất 2/4 indicators tích cực và không có blacklist nặng thì accept
    if (positiveIndicators >= 2 && confidence >= 25 && blacklistScore <= 15) {
      isValidJD = true;
      reasons.push('✓ Document meets multiple JD criteria despite low technical content');
    }
    
    // Đặc biệt: Nếu có job keywords và sections mà thiếu tech keywords thì vẫn accept (general IT roles)
    if (hasJobKeywords && hasJDSections && confidence >= 30) {
      isValidJD = true;
      reasons.push('✓ Strong job description structure found - suitable for general IT roles');
    }

    // Edge case: Very strong job keywords và patterns nhưng thiếu technical terms
    if (foundRequiredKeywords.length >= 4 && this.checkJDPatterns(normalizedText) >= 15) {
      isValidJD = true;
      reasons.push('✓ Strong JD patterns detected - acceptable for non-technical IT positions');
    }

    return {
      isValidJD,
      confidence: Math.round(confidence),
      reasons,
      detectedSections,
      missingCriticalSections
    };
  }

  // Kiểm tra cấu trúc document
  private static checkDocumentStructure(text: string): boolean {
    // Kiểm tra có bullet points hoặc numbered lists
    const hasBullets = /[-•*]\s/.test(text) || /\d+\.\s/.test(text);
    
    // Kiểm tra có headers/sections
    const hasHeaders = /\n[A-Z][A-Za-z\s]+:\s*\n/.test(text);
    
    // Kiểm tra có paragraphs
    const paragraphCount = text.split('\n\n').length;
    
    return hasBullets || hasHeaders || paragraphCount >= 3;
  }

  // Kiểm tra blacklist (nội dung không phải JD)
  private static checkBlacklist(text: string): number {
    let blacklistScore = 0;
    
    this.BLACKLIST_KEYWORDS.forEach(keyword => {
      if (text.includes(keyword)) {
        blacklistScore += 15; // Penalty for each blacklist keyword
      }
    });

    // Kiểm tra patterns của CV/Resume
    if (text.includes('dear hiring manager') || 
        text.includes('i am writing to') ||
        text.includes('i believe i would be') ||
        text.includes('thank you for your consideration')) {
      blacklistScore += 30;
    }

    return Math.min(blacklistScore, 60); // Max penalty 60%
  }

  // Kiểm tra patterns đặc trưng của JD (mở rộng cho tất cả ngành IT)
  private static checkJDPatterns(text: string): number {
    let score = 0;

    // Pattern: "We are looking for" / "We are seeking"
    if (text.includes('we are looking for') || text.includes('we are seeking') || 
        text.includes('looking for') || text.includes('seeking')) {
      score += 10;
    }

    // Pattern: "X+ years of experience"
    if (/\d+\+?\s+years?\s+of\s+experience/.test(text)) {
      score += 10;
    }

    // Pattern: Education requirements
    if (/bachelor'?s?\s+degree|master'?s?\s+degree|diploma|certification/.test(text)) {
      score += 5;
    }

    // Pattern: "Strong knowledge of" / "Experience with" / "Proficiency in"
    if (text.includes('strong knowledge of') || text.includes('experience with') ||
        text.includes('proficiency in') || text.includes('familiar with')) {
      score += 5;
    }

    // Pattern: "Responsible for" / "Will be responsible"
    if (text.includes('responsible for') || text.includes('will be responsible')) {
      score += 5;
    }

    // Pattern: "Join our team" / "Join us"
    if (text.includes('join our team') || text.includes('join us')) {
      score += 5;
    }

    // Pattern: Salary/Benefits mentions
    if (text.includes('competitive salary') || text.includes('benefits') || 
        text.includes('compensation') || text.includes('package')) {
      score += 5;
    }

    return score;
  }

  // Tạo message chi tiết cho user
  static getValidationMessage(result: JDValidationResult): string {
    if (result.isValidJD) {
      return `✅ Valid Job Description detected (${result.confidence}% confidence)`;
    } else {
      let message = `❌ This doesn't appear to be a Job Description (${result.confidence}% confidence)\n\n`;
      message += `Issues found:\n`;
      result.reasons.forEach(reason => {
        message += `• ${reason}\n`;
      });
      
      if (result.missingCriticalSections.length > 0) {
        message += `\nMissing typical JD sections:\n`;
        result.missingCriticalSections.forEach(section => {
          message += `• ${section}\n`;
        });
      }
      
      message += `\nPlease upload a proper Job Description that includes:\n`;
      message += `• Job title and description\n`;
      message += `• Required skills and qualifications\n`;
      message += `• Job responsibilities\n`;
      message += `• Experience requirements\n`;
      message += `• Company information`;
      
      return message;
    }
  }

  // Lấy suggestions để cải thiện JD
  static getSuggestions(result: JDValidationResult): string[] {
    const suggestions: string[] = [];

    if (!result.isValidJD) {
      suggestions.push('Ensure the document contains a clear job title');
      suggestions.push('Include detailed job responsibilities and duties');
      suggestions.push('Add required skills and qualifications section');
      suggestions.push('Specify minimum experience requirements');
      suggestions.push('Include company information and benefits');
      
      if (result.confidence < 30) {
        suggestions.push('This appears to be a different type of document (CV, contract, etc.)');
      }
    }

    return suggestions;
  }
}
