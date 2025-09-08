interface Answer {
  content: string;
  isCorrect?: boolean;
}

interface Question {
  id: string;
  question: string;
  answers: Answer[];
  explanation?: string;
  isMultipleChoice?: boolean;
}

interface QuizMappingResult {
  shuffledQuestions: Question[];
  answerMapping: Record<string, number[]>;
  questionsForUI: Question[];
}

export class QuizMappingService {
  // Shuffle array utility
  static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Shuffle answers và tạo mapping
  static shuffleAnswers(answers: Answer[]): { shuffledAnswers: Answer[], mapping: number[] } {
    const originalIndexes = answers.map((_, index) => index);
    const shuffledIndexes = this.shuffleArray([...originalIndexes]);
    
    const shuffledAnswers = shuffledIndexes.map(index => answers[index]);
    
    // Tạo mapping: mapping[newIndex] = originalIndex
    const mapping = new Array(answers.length);
    shuffledIndexes.forEach((originalIndex, newIndex) => {
      mapping[newIndex] = originalIndex;
    });
    
    return { shuffledAnswers, mapping };
  }

  // Xử lý Secure Quiz: Lấy questions ngẫu nhiên từ database
  static processSecureQuiz(questions: Question[]): QuizMappingResult {
    // 1. Shuffle questions
    const shuffledQuestions = this.shuffleArray([...questions]);
    
    // 2. Shuffle answers cho từng question và tạo mapping
    const answerMapping: Record<string, number[]> = {};
    const questionsForUI = shuffledQuestions.map(question => {
      const answers = question.answers;
      if (answers && answers.length > 0) {
        const { shuffledAnswers, mapping } = this.shuffleAnswers(answers);
        answerMapping[question.id] = mapping;
        
        // Trả về answers KHÔNG có isCorrect cho UI
        const answersForUI = shuffledAnswers.map(answer => ({
          content: answer.content
        }));
        
        const correctAnswerCount = shuffledAnswers.filter(answer => answer.isCorrect).length;
        
        return {
          ...question,
          answers: answersForUI,
          isMultipleChoice: correctAnswerCount > 1
        };
      }
      return question;
    });

    return {
      shuffledQuestions,
      answerMapping,
      questionsForUI
    };
  }

  // Xử lý Retry Quiz: Lấy questions từ quiz gốc
  static processRetryQuiz(originalQuestions: Question[]): QuizMappingResult {
    // Logic giống hệt Secure Quiz nhưng với questions từ quiz gốc
    return this.processSecureQuiz(originalQuestions);
  }

  // Chuyển đổi user answers từ shuffled về original indexes
  static convertUserAnswers(
    userAnswers: { questionId: string; answerIndex: number[] }[],
    answerMapping: Record<string, number[]>
  ): { questionId: string; answerIndex: number[] }[] {
    return userAnswers.map(userAnswer => {
      const mapping = answerMapping[userAnswer.questionId] || [];
      
      if (mapping.length > 0) {
        // Chuyển đổi từ shuffled index về original index
        const originalIndexes = userAnswer.answerIndex.map(shuffledIndex => {
          return mapping[shuffledIndex];
        }).filter(idx => idx !== undefined);
        
        return {
          questionId: userAnswer.questionId,
          answerIndex: originalIndexes
        };
      }
      
      return userAnswer; // Không có mapping thì giữ nguyên
    });
  }

  // Tạo answers theo thứ tự user đã thấy (shuffled) với isCorrect
  static createShuffledAnswersWithCorrect(
    originalAnswers: Answer[],
    mapping: number[]
  ): Answer[] {
    if (mapping.length === 0) {
      return originalAnswers;
    }

    const shuffledAnswers = new Array(originalAnswers.length);
    mapping.forEach((originalIndex, newIndex) => {
      shuffledAnswers[newIndex] = {
        content: originalAnswers[originalIndex].content,
        isCorrect: originalAnswers[originalIndex].isCorrect
      };
    });
    
    return shuffledAnswers;
  }
} 