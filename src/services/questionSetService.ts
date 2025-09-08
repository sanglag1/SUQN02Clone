// services/questionSetService.ts
export interface QuestionSetData {
  id?: string; // Prisma UUID
  jobTitle: string;
  questionType: 'technical' | 'behavioral';
  level: 'junior' | 'mid' | 'senior';
  questions: string[];
  fileName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SaveQuestionSetRequest {
  jobTitle: string;
  questionType: 'technical' | 'behavioral';
  level: 'junior' | 'mid' | 'senior';
  questions: string[];
  originalJDText?: string;
  fileName?: string;
}

export class QuestionSetService {
  private baseUrl = '/api/jd/question-sets';

  // Lưu question set mới
  async saveQuestionSet(data: SaveQuestionSetRequest): Promise<QuestionSetData> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save question set');
    }

    const result = await response.json();
    return result.questionSet;
  }

  // Lấy tất cả question sets của user
  async getAllQuestionSets(): Promise<QuestionSetData[]> {
    try {
      const response = await fetch(this.baseUrl);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `Failed to fetch question sets (${response.status})`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Invalid response format from server');
      }
      
      return result.questionSets || [];
    } catch (error) {
      console.error('Error in getAllQuestionSets:', error);
      throw error;
    }
  }

  // Lấy một question set cụ thể
  async getQuestionSet(id: string): Promise<QuestionSetData> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Question set not found. It may have been deleted or you may not have access to it.');
        }
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `Failed to fetch question set (${response.status})`);
      }

      const result = await response.json();
      
      if (!result.success || !result.questionSet) {
        throw new Error('Invalid response format from server');
      }
      
      return result.questionSet;
    } catch (error) {
      console.error('Error in getQuestionSet:', error);
      throw error;
    }
  }

  // Xóa question set
  async deleteQuestionSet(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to delete question set');
      }
    } catch (error) {
      console.error('Error in deleteQuestionSet:', error);
      throw error instanceof Error ? error : new Error('Failed to delete question set');
    }
  }

  // Extract job title từ filename hoặc text
  extractJobTitle(fileName?: string, jdText?: string): string {
    if (fileName) {
      // Remove extension và clean up filename
      return fileName
        .replace(/\.(pdf|doc|docx|txt)$/i, '')
        .replace(/[_-]/g, ' ')
        .trim()
        .substring(0, 100);
    }

    if (jdText) {
      // Extract từ đầu text, tìm job title patterns
      const lines = jdText.split('\n').slice(0, 10); // Chỉ xem 10 dòng đầu
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 5 && trimmed.length < 100) {
          // Có thể là job title
          if (!trimmed.toLowerCase().includes('company') && 
              !trimmed.toLowerCase().includes('about') &&
              !trimmed.toLowerCase().includes('description')) {
            return trimmed;
          }
        }
      }
    }

    return 'Untitled Position';
  }
}

export const questionSetService = new QuestionSetService();
