"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, CreditCard, Star, BarChart3, Brain, Award, BookOpen, Zap, Target, Users } from 'lucide-react';
import { extractTopics, generateQuestionsForTopic, evaluateAnswer } from '@/services/interviewService';
import StartScreen from './StartScreen';
import InterviewScreen from './InterviewScreen';
import ResultScreen from './ResultScreen';

// Removed local CATEGORY_ROLE_OPTIONS and levelOptions. We use preferences API instead.

// Cấu hình cho interview
const INTERVIEW_CONFIG = {
  maxQuestions: 10, // Giới hạn 10 câu hỏi chính thức (không tính giới thiệu)
  reviewTimeSeconds: 10 // 10 giây để review sau câu cuối
};

export interface ConversationMessage {
  id: string | number;
  sender: 'user' | 'ai';
  text: string;
  isError?: boolean;
  timestamp?: string;
}

interface RealTimeScores {
  fundamental: number;
  logic: number;
  language: number;
  suggestions: {
    fundamental: string;
    logic: string;
    language: string;
  };
}

interface EvaluationScores {
  fundamentalKnowledge: number;
  logicalReasoning: number;
  languageFluency: number;
  overall: number;
}

interface HistoryStage {
  question: string;
  answer: string;
  evaluation: {
    scores: {
      fundamental: number;
      logic: number;
      language: number;
    };
    suggestions: {
      fundamental: string;
      logic: string;
      language: string;
    };
    isRelevant?: boolean;
  };
  topic: string;
  timestamp: string;
  questionNumber?: number; // Thêm số thứ tự câu hỏi
}

interface InterviewState {
  phase: 'introduction' | 'interviewing' | 'completed';
  topics: string[];
  currentTopicIndex: number;
  questions: string[];
  currentQuestionIndex: number;
}

// Get default topics based on position when introduction doesn't provide relevant topics
const getDefaultTopicsForPosition = (position: string): string[] => {
  const lowerPosition = position.toLowerCase();
  if (lowerPosition.includes('frontend')) {
    return ['HTML/CSS', 'JavaScript', 'React', 'Responsive Design', 'UI/UX'];
  } else if (lowerPosition.includes('backend')) {
    return ['API Development', 'Database', 'Server Architecture', 'Authentication', 'Security'];
  } else if (lowerPosition.includes('fullstack')) {
    return ['Frontend Development', 'Backend Development', 'Database', 'API Integration', 'Full Stack Architecture'];
  } else if (lowerPosition.includes('mobile')) {
    return ['Mobile Development', 'App Architecture', 'Mobile UI/UX', 'Platform APIs', 'Performance'];
  } else if (lowerPosition.includes('devops')) {
    return ['CI/CD', 'Cloud Services', 'Containerization', 'Infrastructure', 'Monitoring'];
  } else if (lowerPosition.includes('qa') || lowerPosition.includes('test')) {
    return ['Testing Methodologies', 'Test Automation', 'Bug Tracking', 'Quality Assurance', 'Test Planning'];
  }
  return ['Programming', 'Problem Solving', 'Software Development', 'Technical Skills', 'Best Practices'];
};

// Định nghĩa lại createMessage đúng vị trí
const createMessage = (sender: 'user' | 'ai', text: string, isError = false): ConversationMessage => ({
  id: Date.now(), sender, text, timestamp: new Date().toISOString(), isError
});

export default function TestPanel() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [interviewing, setInterviewing] = useState(false);
  const [category, setCategory] = useState('');
  const [position, setPosition] = useState('Frontend Developer');
  const [level, setLevel] = useState('Junior');
  const [duration, setDuration] = useState(15);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  const [interviewState, setInterviewState] = useState<InterviewState>({
    phase: 'introduction',
    topics: [],
    currentTopicIndex: 0,
    questions: [],
    currentQuestionIndex: 0
  });

  // NEW: Track if initial AI message has been sent
  const [hasSentInitialMessage, setHasSentInitialMessage] = useState(false);
  const [history, setHistory] = useState<HistoryStage[]>([]);

  // Thêm state để theo dõi số câu hỏi chính thức đã hỏi
  const [officialQuestionCount, setOfficialQuestionCount] = useState(0);
  
  // Thêm state để theo dõi review countdown
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewCountdown, setReviewCountdown] = useState(0);

  const [showResult, setShowResult] = useState(false);

  // Thêm state lưu điểm real-time
  const [realTimeScores, setRealTimeScores] = useState<RealTimeScores>({
    fundamental: 0,
    logic: 0,
    language: 0,
    suggestions: {
      fundamental: '',
      logic: '',
      language: ''
    }
  });

  // Thêm state lưu feedback cuối cùng
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  // Thời gian bắt đầu interview
  const [interviewStartTime, setInterviewStartTime] = useState<number | null>(null);

  // Thêm state lưu thời gian còn lại
  const [remainingTime, setRemainingTime] = useState<number>(duration);
  // Lock page scroll during interview to avoid outer scrollbar
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (interviewing) {
        root.style.overflow = 'hidden';
      } else {
        root.style.overflow = '';
      }
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.documentElement.style.overflow = '';
      }
    };
  }, [interviewing]);

  // State cho package limit check
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [packageLimitInfo, setPackageLimitInfo] = useState({
    currentUsage: 0,
    totalLimit: 0,
    packageName: ''
  });

  // State để lưu assessment ID cho real-time updates
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [conversation]);

  // Prefill from interview preferences (same API as avatar AI)
  useEffect(() => {
    const loadPreferencesForTestMode = async () => {
      try {
        const response = await fetch('/api/profile/interview-preferences');
        if (!response.ok) return;
        const prefs = await response.json();

        // If auto-start is enabled and there is a preferred job role, prefill
        if (prefs?.autoStartWithPreferences && prefs?.preferredJobRole) {
          const preferredRole = prefs.preferredJobRole as {
            title?: string;
            level?: string;
            category?: { name?: string } | null;
          };

          // Determine category for this position
          const roleTitle = preferredRole?.title || '';
          const roleLevel = preferredRole?.level || '';
          const categoryNameFromPref = preferredRole?.category?.name || '';

          if (categoryNameFromPref) setCategory(categoryNameFromPref);
          if (roleTitle) setPosition(roleTitle);
          if (roleLevel) setLevel(roleLevel);

          // Keep current duration; user can adjust on UI. If you want a default later, add preferredDuration to preferences.
        }
      } catch (e) {
        console.error('Failed to load interview preferences for test mode:', e);
      }
    };

    loadPreferencesForTestMode();
     
  }, []);

  // NEW: Send initial AI message only on client after interviewing starts
  useEffect(() => {
    if (interviewing && !hasSentInitialMessage) {
      setConversation([]);
      void addAiMessageTyping(`Hello! I am the AI Interviewer. Today we will conduct an interview for the position of ${position} (${level}). First, could you briefly introduce yourself and your work experience?`);
      setHasSentInitialMessage(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewing]);



  const startInterview = async () => {
    // Kiểm tra hạn mức trước khi bắt đầu interview
    try {
      const res = await fetch('/api/user-package/check-active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      console.log('Package check response:', data); // Debug log
      
      // Validate response structure
      if (!data || typeof data.hasActivePackage !== 'boolean') {
        throw new Error('Invalid response structure from package check API');
      }
      
      // Validate usage data structure
      if (!data.usage || !data.usage.testQuizEQ) {
        throw new Error('Missing testQuizEQ usage data in package check response');
      }
      
      // Kiểm tra cụ thể cho testQuizEQ service (test-mode sử dụng)
      if (!data.usage.testQuizEQ.canUse) {
        // Lấy thông tin gói hiện tại để hiển thị
        setPackageLimitInfo({
          currentUsage: data.usage.testQuizEQ.currentUsage || 0,
          totalLimit: data.usage.testQuizEQ.serviceLimit || 0,
          packageName: data.selectedPackage?.name || 'Gói hiện tại'
        });
        setShowUpgradeModal(true);
        return;
      }
      
      // Kiểm tra thêm: nếu không có gói active
      if (!data.hasActivePackage) {
        setPackageLimitInfo({
          currentUsage: 0,
          totalLimit: 0,
          packageName: 'Chưa có gói'
        });
        setShowUpgradeModal(true);
        return;
      }
      
      console.log('✅ Package check passed, starting interview...');
    } catch (error) {
      console.error('Error checking package limits:', error);
      // Hiển thị modal lỗi
      setPackageLimitInfo({
        currentUsage: 0,
        totalLimit: 0,
        packageName: 'Lỗi kiểm tra gói'
      });
      setShowUpgradeModal(true);
      return;
    }

    // Nếu pass được check limit, tiếp tục start interview
    setShowResult(false);
    setInterviewing(true);
    setInterviewState({
      phase: 'introduction',
      topics: [],
      currentTopicIndex: 0,
      questions: [],
      currentQuestionIndex: 0
    });
    setHasSentInitialMessage(false);
    setHistory([]);
    setOfficialQuestionCount(0); // Reset số câu hỏi chính thức
    setIsReviewing(false); // Reset review state
    setReviewCountdown(0); // Reset countdown
    setRealTimeScores({
      fundamental: 0,
      logic: 0,
      language: 0,
      suggestions: {
        fundamental: '',
        logic: '',
        language: ''
      }
    });
    setConversation([]);
    setMessage('');
    setLastFeedback(null); // Reset AI feedback khi bắt đầu phiên mới
    setInterviewStartTime(Date.now()); // Lưu thời điểm bắt đầu

    // ✨ NEW: Tạo draft assessment ngay từ đầu
    try {
      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'test',
          position: position,
          level: level,
          duration: duration,
          selectedCategory: category, // Sử dụng selectedCategory thay vì category
          history: [], // Empty history array, không cần JSON.stringify
        }),
      });

      if (response.ok) {
        const assessmentData = await response.json();
        setCurrentAssessmentId(assessmentData.id);
        console.log(`✅ Created draft assessment: ${assessmentData.id}`);
        console.log('🔵 [DEBUG] Current assessment ID set to:', assessmentData.id);
        console.log('🔵 [DEBUG] Assessment data:', assessmentData);
      } else {
        console.error('Failed to create draft assessment:', response.status);
      }
    } catch (error) {
      console.error('Error creating draft assessment:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    const userMessage = createMessage('user', message);
    addMessageToConversation(setConversation, userMessage);
    setMessage('');
    setIsAiThinking(true);
    try {
      switch (interviewState.phase) {
        case 'introduction':
          await handleIntroductionPhase(
            message,
            setConversation,
            setInterviewState,
            position
          );
          break;
        case 'interviewing':
          await handleInterviewingPhase(
            message,
            interviewState,
            setInterviewState,
            setConversation,
            setInterviewing
          );
          break;
        case 'completed':
          break;
      }
    } catch {
      const errorMessage = createMessage(
        'ai',
        'Sorry, an error occurred while ending the interview. Please try again.',
        true
      );
      addMessageToConversation(setConversation, errorMessage);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Hàm tóm tắt history cho AI
  const getHistorySummary = () => {
    if (history.length === 0) return '';
    return history.map((stage, idx) =>
      `Question ${idx + 1}: ${stage.question}\nAnswer: ${stage.answer}`
    ).join('\n\n');
  };

  // Phase handling functions
  const handleIntroductionPhase = async (
    message: string,
    setConversation: React.Dispatch<React.SetStateAction<ConversationMessage[]>>,
    setInterviewState: React.Dispatch<React.SetStateAction<InterviewState>>,
    position: string
  ) => {
    const topics = await extractTopics(message);
    if (!topics || topics.length === 0) {
      await addAiMessageTyping(
        `I noticed you didn't introduce yourself and your work experience. Could you briefly introduce yourself and your work experience in the field of ${position}?`
      );
      return;
    }
    const technicalKeywords = ['frontend', 'backend', 'fullstack', 'react', 'angular', 'vue', 'javascript', 'html', 'css', 'api', 'database', 'sql', 'python', 'java', 'c++', 'c#', 'devops', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'mobile', 'ios', 'android', 'qa', 'testing', 'ui/ux', 'next.js', 'tailwind css'];
    
    // Define position-specific keywords for better topic prioritization
    const getPositionKeywords = (position: string): string[] => {
      const lowerPosition = position.toLowerCase();
      if (lowerPosition.includes('frontend')) {
        return ['html', 'css', 'javascript', 'react', 'angular', 'vue', 'ui/ux', 'responsive', 'browser', 'dom', 'frontend'];
      } else if (lowerPosition.includes('backend')) {
        return ['api', 'database', 'sql', 'server', 'node.js', 'express', 'backend', 'authentication', 'security'];
      } else if (lowerPosition.includes('fullstack')) {
        return ['html', 'css', 'javascript', 'react', 'api', 'database', 'fullstack', 'integration'];
      } else if (lowerPosition.includes('mobile')) {
        return ['mobile', 'ios', 'android', 'react native', 'flutter', 'app'];
      } else if (lowerPosition.includes('devops')) {
        return ['devops', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'deployment'];
      }
      return technicalKeywords;
    };

    const positionKeywords = getPositionKeywords(position);
    
    const prioritizedTopics = topics.sort((a: string, b: string) => {
      // First priority: position-specific keywords
      const aIsPositionRelevant = positionKeywords.some(keyword => a.toLowerCase().includes(keyword)) ? 2 : 0;
      const bIsPositionRelevant = positionKeywords.some(keyword => b.toLowerCase().includes(keyword)) ? 2 : 0;
      
      // Second priority: general technical keywords
      const aIsTechnical = technicalKeywords.some(keyword => a.toLowerCase().includes(keyword)) ? 1 : 0;
      const bIsTechnical = technicalKeywords.some(keyword => b.toLowerCase().includes(keyword)) ? 1 : 0;
      
      const aScore = aIsPositionRelevant + aIsTechnical;
      const bScore = bIsPositionRelevant + bIsTechnical;
      
      return bScore - aScore;
    });
    
    let firstTopic = prioritizedTopics[0];
    
    // If no relevant topics found from introduction, use position-based default topics
    if (!firstTopic || !positionKeywords.some(keyword => firstTopic.toLowerCase().includes(keyword))) {
      const defaultTopics = getDefaultTopicsForPosition(position);
      firstTopic = defaultTopics[0];
    }
    
    const questions = await generateQuestionsForTopic(firstTopic, level, position);
    if (!questions || questions.length === 0) {
      await addAiMessageTyping(
        `Sorry, I'm having trouble creating detailed questions about the topic ${firstTopic}. Would you like to try introducing it again or focusing on other skills?`
      );
      return;
    }
    setInterviewState({
      phase: 'interviewing',
      topics,
      currentTopicIndex: 0,
      questions,
      currentQuestionIndex: 0
    });
    // Cảm ơn sau phần giới thiệu
    await addAiMessageTyping(
      `Thank you for introducing yourself and your work experience! Now let's start with professional questions.\n\n${questions[0]}`
    );
  };

  const handleInterviewingPhase = async (
    message: string,
    interviewState: InterviewState,
    setInterviewState: React.Dispatch<React.SetStateAction<InterviewState>>,
    setConversation: React.Dispatch<React.SetStateAction<ConversationMessage[]>>,
    setInterviewing: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    console.log(`🔍 [DEBUG] handleInterviewingPhase called with message: "${message.substring(0, 50)}..."`);
    
    // FIX: Always evaluate answer against the last question sent
    const lastQuestionIndex = interviewState.currentQuestionIndex;
    const currentQuestion = interviewState.questions[lastQuestionIndex];
    console.log(`🔍 [DEBUG] currentQuestion: ${currentQuestion ? 'exists' : 'null'}, questionIndex: ${lastQuestionIndex}`);
    
    if (!currentQuestion) {
      const errorMessage = createMessage(
        'ai',
        'Sorry, an error occurred while processing the current question. Let\'s try switching to a different topic.',
        true
      );
      addMessageToConversation(setConversation, errorMessage);
      await handleQuestionTransition(interviewState, setInterviewState, setConversation, setInterviewing);
      return;
    }
    const evaluation = await evaluateAnswer(currentQuestion, message, getHistorySummary());
    console.log(`🔍 [DEBUG] evaluation result:`, evaluation);
    
    // Cập nhật điểm real-time (chuyển từ thang 0-10 sang 0-100)
    // Chỉ cập nhật nếu câu trả lời liên quan; tránh ghi đè điểm bằng 0 khi user trả lời lạc đề
    if (evaluation && evaluation.scores && evaluation.isRelevant !== false) {
      setRealTimeScores({
        fundamental: Math.max(0, Math.min(100, Math.round((evaluation.scores.fundamental || 0) * 10))),
        logic: Math.max(0, Math.min(100, Math.round((evaluation.scores.logic || 0) * 10))),
        language: Math.max(0, Math.min(100, Math.round((evaluation.scores.language || 0) * 10))),
        suggestions: evaluation.suggestions || realTimeScores.suggestions
      });
    }
    // Nếu câu trả lời không liên quan, hỏi lại câu hỏi hiện tại với lời nhắc thân thiện
    if (evaluation && evaluation.isRelevant === false) {
      console.log(`⚠️ [DEBUG] Answer not relevant, asking again`);
      await addAiMessageTyping(
        `It seems your answer didn't address the question. No worries! Could you please try answering again?\n\n${currentQuestion}`
      );
      setLastFeedback("Let's try to answer the question above as clearly as you can!");
      // Không cập nhật real-time scores khi câu trả lời không liên quan
      return;
    }
    // Lưu vào history với số thứ tự câu hỏi
    console.log(`✅ [DEBUG] About to call addHistoryStage for question ${officialQuestionCount + 1}`);
    addHistoryStage({
      question: currentQuestion,
      answer: message,
      evaluation,
      topic: interviewState.topics[interviewState.currentTopicIndex],
      timestamp: new Date().toISOString(),
      questionNumber: officialQuestionCount + 1 // Thêm số thứ tự câu hỏi
    });

    // Tăng số câu hỏi chính thức đã hỏi
    const newQuestionCount = officialQuestionCount + 1;
    setOfficialQuestionCount(newQuestionCount);
    if (!evaluation || typeof evaluation.isComplete === 'undefined') {
      const errorMessage = createMessage(
        'ai',
        'Sorry, an error occurred while evaluating your answer. Let\'s try switching to the next question.',
        true
      );
      addMessageToConversation(setConversation, errorMessage);
      await handleQuestionTransition(interviewState, setInterviewState, setConversation, setInterviewing);
      return;
    }
    // --- Markdown formatting improvement ---
    let responseText = `**Answer Evaluation:**\n`;
    if (evaluation.strengths && evaluation.strengths.length > 0) {
      responseText += `- **Strengths:**\n`;
      responseText += evaluation.strengths.map((s: string) => `  - ${s}`).join("\n") + "\n";
    }
    if (evaluation.missingPoints && evaluation.missingPoints.length > 0) {
      responseText += `- **Missing Points to Improve:**\n`;
      responseText += evaluation.missingPoints.map((p: string) => `  - ${p}`).join("\n") + "\n";
    }
    if (evaluation.suggestedImprovements && evaluation.suggestedImprovements.length > 0) {
      responseText += `- **Suggested Improvements:**\n`;
      responseText += evaluation.suggestedImprovements.map((i: string) => `  - ${i}`).join("\n") + "\n";
    }
    let nextQuestion = '';
    if (evaluation.followUpQuestions && evaluation.followUpQuestions.length > 0) {
      nextQuestion = evaluation.followUpQuestions[0];
    }
    // set feedback thay vì add vào chat
    setLastFeedback(responseText);
    
    // Kiểm tra nếu đã hỏi đủ 10 câu hỏi chính thức
    if (newQuestionCount >= INTERVIEW_CONFIG.maxQuestions) {
      // Bắt đầu countdown 10 giây để review
      startReviewCountdown();
      return;
    }
    
    // Nếu vẫn muốn AI hỏi tiếp: gửi lời cảm ơn rồi gõ từ từ câu tiếp theo
    if (nextQuestion) {
      const acknowledgements = [
        'Thanks for your answer! ',
        'Great, appreciate the details. ',
        'Got it, thank you! ',
      ];
      const ack = acknowledgements[Math.floor(Math.random() * acknowledgements.length)] + 'Here is the next question:';
      await addAiMessageTyping(ack);
      await addAiMessageTyping(nextQuestion);
    }
    if (evaluation.isComplete && (!evaluation.followUpQuestions || evaluation.followUpQuestions.length === 0)) {
      await handleQuestionTransition(interviewState, setInterviewState, setConversation, setInterviewing);
    }
  };

  // Fix: increment currentQuestionIndex only AFTER sending the next question
  const handleQuestionTransition = async (
    interviewState: InterviewState,
    setInterviewState: React.Dispatch<React.SetStateAction<InterviewState>>,
    setConversation: React.Dispatch<React.SetStateAction<ConversationMessage[]>>,
    setInterviewing: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    const nextQuestionIndex = interviewState.currentQuestionIndex + 1;
    if (nextQuestionIndex < interviewState.questions.length) {
      const nextQuestion = createMessage('ai', interviewState.questions[nextQuestionIndex]);
      addMessageToConversation(setConversation, nextQuestion);
      setInterviewState((prev: InterviewState) => ({
        ...prev,
        currentQuestionIndex: nextQuestionIndex
      }));
      return;
    }
    await handleTopicTransition(interviewState, setInterviewState, setConversation, setInterviewing);
  };

  const handleTopicTransition = async (
    interviewState: InterviewState,
    setInterviewState: React.Dispatch<React.SetStateAction<InterviewState>>,
    setConversation: React.Dispatch<React.SetStateAction<ConversationMessage[]>>,
    setInterviewing: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    const nextTopicIndex = interviewState.currentTopicIndex + 1;
    if (nextTopicIndex < interviewState.topics.length) {
      const nextTopic = interviewState.topics[nextTopicIndex];
      const nextTopicQuestions = await generateQuestionsForTopic(nextTopic, level, position);
      if (!nextTopicQuestions || nextTopicQuestions.length === 0) {
        const noQuestionsMessage = createMessage(
          'ai',
          `Sorry, I'm having trouble creating detailed questions about the topic ${nextTopic}. We can switch to a different topic or end the interview.`
        );
        addMessageToConversation(setConversation, noQuestionsMessage);
        const nextNextTopicIndex = nextTopicIndex + 1;
        if (nextNextTopicIndex < interviewState.topics.length) {
          setInterviewState((prev: InterviewState) => ({
            ...prev,
            currentTopicIndex: nextNextTopicIndex,
            questions: [],
            currentQuestionIndex: 0
          }));
        } else {
          await endInterview(setInterviewState, setInterviewing, setConversation);
        }
        return;
      }
      setInterviewState((prev: InterviewState) => ({
        ...prev,
        currentTopicIndex: nextTopicIndex,
        questions: nextTopicQuestions,
        currentQuestionIndex: 0
      }));
      const nextQuestion = createMessage('ai', nextTopicQuestions[0]);
      addMessageToConversation(setConversation, nextQuestion);
      return;
    }
    await endInterview(setInterviewState, setInterviewing, setConversation);
  };

  // Hàm tính điểm trung bình cho 3 tiêu chí
  const calculateFinalScores = React.useCallback((): EvaluationScores => {
    if (history.length === 0) {
      return {
        fundamentalKnowledge: 0,
        logicalReasoning: 0,
        languageFluency: 0,
        overall: 0
      };
    }
  
    // Lọc ra các stage có đánh giá hợp lệ
    const validStages = history.filter(stage => 
      stage.evaluation?.scores && 
      typeof stage.evaluation.scores.fundamental === 'number' &&
      typeof stage.evaluation.scores.logic === 'number' &&
      typeof stage.evaluation.scores.language === 'number'
    );
  
    if (validStages.length === 0) {
      return {
        fundamentalKnowledge: 0,
        logicalReasoning: 0,
        languageFluency: 0,
        overall: 0
      };
    }
  
    // Tính tổng điểm cho từng tiêu chí
    const totalScores = validStages.reduce((acc, stage) => ({
      fundamentalKnowledge: acc.fundamentalKnowledge + stage.evaluation.scores.fundamental,
      logicalReasoning: acc.logicalReasoning + stage.evaluation.scores.logic,
      languageFluency: acc.languageFluency + stage.evaluation.scores.language
    }), {
      fundamentalKnowledge: 0,
      logicalReasoning: 0,
      languageFluency: 0
    });
  
    // Tính điểm trung bình
    const averageScores = {
      fundamentalKnowledge: totalScores.fundamentalKnowledge / validStages.length,
      logicalReasoning: totalScores.logicalReasoning / validStages.length,
      languageFluency: totalScores.languageFluency / validStages.length
    };
  
    // Tính điểm tổng thể
    return {
      ...averageScores,
      overall: (averageScores.fundamentalKnowledge + averageScores.logicalReasoning + averageScores.languageFluency) / 3
    };
  }, [history]);
  
  // (Removed duplicate calculateFinalScores function)
  
  const endInterview = useCallback(async (
    setInterviewState: React.Dispatch<React.SetStateAction<InterviewState>>,
    setInterviewing: React.Dispatch<React.SetStateAction<boolean>>,
    setConversation: React.Dispatch<React.SetStateAction<ConversationMessage[]>>
  ) => {
    setInterviewState((prev: InterviewState) => ({
      ...prev,
      phase: 'completed'
    }));
    console.log('🔵 [DEBUG] handleEndInterview called');
    console.log('🔵 [DEBUG] currentAssessmentId:', currentAssessmentId);
    console.log('🔵 [DEBUG] history length:', history.length);
    
    const endingMessage = createMessage(
      'ai',
      'Thank you for participating in the interview. We will summarize the results now.'
    );
    addMessageToConversation(setConversation, endingMessage);
    setInterviewing(false);
    setShowResult(true);
  
    // Tính tổng thời gian làm bài (làm tròn lên phút)
    let totalTime = null;
    if (interviewStartTime) {
      const diffMs = Date.now() - interviewStartTime;
      totalTime = Math.ceil(diffMs / 60000); // làm tròn lên phút
    }
  
    // ✨ UPDATED: Cập nhật assessment hiện tại thay vì tạo mới
    try {
      if (currentAssessmentId) {
        // Tính finalScores với trường overall
        const finalScores = calculateFinalScores();
        
        // PATCH để hoàn thành assessment
        await fetch(`/api/assessment/${currentAssessmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            realTimeScores,
            finalScores: {
              fundamental: finalScores.fundamentalKnowledge,
              logic: finalScores.logicalReasoning,
              language: finalScores.languageFluency,
              overall: finalScores.overall
            },
            totalTime,
            status: 'completed', // ✅ Sử dụng status thay vì isComplete
            isComplete: true // Giữ lại để backward compatibility
          })
        });
        console.log(`✅ Interview completed and saved for assessment: ${currentAssessmentId}`);
      } else {
        // Fallback: Tạo assessment mới nếu không có ID (backward compatibility)
        console.warn('No assessment ID found, creating new assessment as fallback');
        await fetch('/api/assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'test',
            duration,
            position,
            level,
            history,
            realTimeScores,
            totalTime,
          })
        });
      }
    } catch (error) {
      console.error('Error saving interview result:', error);
    }
  }, [duration, position, level, history, realTimeScores, interviewStartTime, currentAssessmentId, calculateFinalScores]);
  
  // Hàm luyện tập lại
  const handleReset = () => {
    setShowResult(false);
    setInterviewing(false);
    setConversation([]);
    setMessage('');
    setInterviewState({
      phase: 'introduction',
      topics: [],
      currentTopicIndex: 0,
      questions: [],
      currentQuestionIndex: 0
    });
    setOfficialQuestionCount(0); // Reset số câu hỏi
    setIsReviewing(false); // Reset review state
    setReviewCountdown(0); // Reset countdown
  };

  const addMessageToConversation = (
    setConversation: React.Dispatch<React.SetStateAction<ConversationMessage[]>>,
    message: ConversationMessage
  ) => {
    setConversation(prev => [...prev, message]);
  };

  // Typewriter effect for AI messages
  async function addAiMessageTyping(text: string, typingDelayMs = 15) {
    const id = Date.now() + Math.random();
    const base: ConversationMessage = {
      id,
      sender: 'ai',
      text: '',
      timestamp: new Date().toISOString()
    };
    addMessageToConversation(setConversation, base);
    setIsAiThinking(true);
    try {
      let i = 0;
      while (i < text.length) {
        const chunkEnd = Math.min(text.length, i + 2);
        const slice = text.slice(0, chunkEnd);
        setConversation(prev => prev.map(m => m.id === id ? { ...m, text: slice } : m));
        i = chunkEnd;
        await new Promise(res => setTimeout(res, typingDelayMs));
      }
    } finally {
      setIsAiThinking(false);
    }
  }

  // BỔ SUNG hàm addHistoryStage để tránh lỗi khi gọi trong handleInterviewingPhase
  const addHistoryStage = async (stage: HistoryStage) => {
    console.log('🔵 [DEBUG] addHistoryStage called with:', stage);
    setHistory(prev => [...prev, stage]);
    if (currentAssessmentId && (!stage.evaluation || stage.evaluation.isRelevant !== false)) {
      console.log('🔵 [DEBUG] Saving real-time to assessment:', currentAssessmentId);
      try {
        const response = await fetch(`/api/assessment/${currentAssessmentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: stage.question,
            answer: stage.answer,
            evaluation: stage.evaluation,
            topic: stage.topic,
            questionNumber: stage.questionNumber,
            realTimeScores: realTimeScores,
            isComplete: false // Chưa hoàn thành
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Real-time saved question ${stage.questionNumber}, total history: ${result.historyCount}`);
        } else {
          console.error('Failed to save real-time:', response.status);
        }
      } catch (error) {
        console.error('Error saving real-time:', error);
      }
    } else {
      console.log('🔴 [DEBUG] No currentAssessmentId, skipping real-time save');
    }
  };

  // Hàm bắt đầu countdown review sau câu hỏi cuối
  const startReviewCountdown = () => {
    setIsReviewing(true);
    setReviewCountdown(INTERVIEW_CONFIG.reviewTimeSeconds);
    
    // Hiển thị thông báo cho user
    const reviewMessage = createMessage(
      'ai', 
      `You have completed all ${INTERVIEW_CONFIG.maxQuestions} interview questions! Please take ${INTERVIEW_CONFIG.reviewTimeSeconds} seconds to review your answers. The interview will end automatically.`
    );
    addMessageToConversation(setConversation, reviewMessage);
  };

  // Effect để countdown review time
  useEffect(() => {
    if (isReviewing && reviewCountdown > 0) {
      const timer = setTimeout(() => {
        setReviewCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isReviewing && reviewCountdown === 0) {
      // Hết thời gian review, tự động kết thúc interview
      const finalMessage = createMessage(
        'ai',
        'Time\'s up! Thank you for participating in the interview. We will now provide your final evaluation.'
      );
      addMessageToConversation(setConversation, finalMessage);
      
      // Delay một chút rồi kết thúc
      setTimeout(() => {
        endInterview(setInterviewState, setInterviewing, setConversation);
      }, 2000);
    }
  }, [isReviewing, reviewCountdown, endInterview]);

  // Callback nhận thời gian còn lại từ InterviewScreen/InterviewChat
  const handleEndInterviewWithTime = (minutesLeft: number) => {
  setRemainingTime(minutesLeft);
  const totalTime = Math.ceil(duration - minutesLeft);

  // Tính finalScores với trường overall
  const finalScores = calculateFinalScores();

  try {
    if (currentAssessmentId) {
      // Cập nhật assessment hiện tại
      fetch(`/api/assessment/${currentAssessmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          realTimeScores,
          finalScores: {
            fundamental: finalScores.fundamentalKnowledge,
            logic: finalScores.logicalReasoning,
            language: finalScores.languageFluency,
            overall: finalScores.overall
          },
          totalTime,
          status: 'completed',
          isComplete: true
        })
      }).catch(error => {
        console.error('[DEBUG] API error updating assessment:', error);
      });
    } else {
      // Fallback: Tạo assessment mới nếu không có ID
      fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test',
          duration,
          position,
          level,
          history,
          realTimeScores,
          finalScores: {
            fundamental: finalScores.fundamentalKnowledge,
            logic: finalScores.logicalReasoning,
            language: finalScores.languageFluency,
            overall: finalScores.overall
          },
          totalTime,
          status: 'completed',
        })
      }).catch(error => {
        console.error('[DEBUG] API error creating new assessment:', error);
      });
    }
  } catch (error) {
    console.error('Error saving interview result:', error);
  }
  setShowResult(true);
  setInterviewing(false);
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="w-full mx-0 p-0">
        {/* Top Section: Main Content + Selected Position Sidebar */}
        <div className={`grid gap-8 ${interviewing ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}>
          <div className={interviewing ? 'col-span-1' : 'lg:col-span-3'}>
            {showResult ? (
              <ResultScreen
                results={{
                  duration,
                  position,
                  level,
                  scores: calculateFinalScores(),
                  messages: conversation,
                  timestamp: new Date().toISOString(),
                  totalTime: Math.ceil(duration - remainingTime),
                }}
                realTimeScores={realTimeScores}
                onReset={handleReset}
              />
            ) : !interviewing ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow border border-slate-200 overflow-hidden">
                {/* Header - ChatGPT Style */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white">Assessment Mode - Interview Practice</h1>
                      <p className="text-blue-100">Choose your settings and start practicing for your dream job</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <StartScreen
                    category={category}
                    position={position}
                    level={level}
                    duration={duration}
                    setCategory={setCategory}
                    setPosition={setPosition}
                    setLevel={setLevel}
                    setDuration={setDuration}
                    startInterview={startInterview}
                  />
                </div>
              </div>
            ) : (
              <InterviewScreen
                position={position}
                conversation={conversation.map(msg => ({
                  role: msg.sender,
                  content: msg.text
                }))}
                message={message}
                isAiThinking={isAiThinking}
                onSendMessage={handleSendMessage}
                onMessageChange={(e) => setMessage(e.target.value)}
                onEndInterview={handleEndInterviewWithTime}
                messageListRef={messageListRef}
                duration={duration}
                realTimeScores={{
                  fundamental: realTimeScores.fundamental,
                  logic: realTimeScores.logic,
                  language: realTimeScores.language
                } as Record<string, number>}
                lastFeedback={lastFeedback}
                isReviewing={isReviewing}
                reviewCountdown={reviewCountdown}
                officialQuestionCount={officialQuestionCount}
                maxQuestions={INTERVIEW_CONFIG.maxQuestions}
              />
            )}
          </div>

          {/* Selected Position Sidebar - Enhanced - Hidden during interview */}
          {!interviewing && (
            <div className="lg:col-span-1">
              <Card className="bg-slate-50/80 shadow-xl border border-slate-300/40 rounded-2xl overflow-hidden sticky top-6">
                <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Target className="h-5 w-5" />
                    </div>
                    Selected Position
                  </CardTitle>
                  <p className="text-emerald-100 text-sm mt-1">Your current interview setup</p>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                        <span className="text-sm font-medium text-slate-600">Field</span>
                      </div>
                      <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 font-medium px-3 py-1">
                        {category}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-slate-600">Position</span>
                      </div>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 font-medium px-3 py-1">
                        {position}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span className="text-sm font-medium text-slate-600">Level</span>
                      </div>
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 font-medium px-3 py-1">
                        {level}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-slate-600">Duration</span>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 font-medium px-3 py-1">
                        {duration} min
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Bottom Section: Enhanced Info Cards - Hidden during interview */}
        {!interviewing && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Evaluation Criteria Card - Enhanced */}
            <Card className="bg-slate-50/80 shadow-xl border border-slate-300/40 rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  Evaluation Criteria
                </CardTitle>
                <p className="text-blue-100 text-sm mt-1">How we assess your performance</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors duration-200">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 mb-1">Basic Knowledge</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">Technical concepts and domain-specific understanding</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100 hover:bg-amber-100 transition-colors duration-200">
                    <div className="flex-shrink-0 w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 mb-1">Logical Thinking</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">Problem-solving approach and reasoning skills</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors duration-200">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 mb-1">Communication</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">Clarity of expression and language proficiency</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Why Practice Card - Enhanced */}
            <Card className="bg-slate-50/80 shadow-xl border border-slate-300/40 rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-5 w-5" />
                  </div>
                  Why Practice Interviewing?
                </CardTitle>
                <p className="text-purple-100 text-sm mt-1">Benefits of regular interview practice</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      1
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="font-semibold text-slate-800 mb-2">Build Confidence</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">Regular practice reduces anxiety and builds natural confidence for real interviews</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      2
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="font-semibold text-slate-800 mb-2">Improve Skills</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">Get detailed AI feedback to continuously improve your answering techniques</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      3
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="font-semibold text-slate-800 mb-2">Learn Patterns</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">Familiarize yourself with common interview patterns in your field</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Upgrade Modal - Enhanced with light theme */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-red-500 to-pink-600 p-6 rounded-t-2xl">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2"
                onClick={() => setShowUpgradeModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Upgrade to Premium
                </h3>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {/* Message */}
              <p className="text-gray-600 mb-4">
                {packageLimitInfo.packageName === 'No package' 
                  ? 'You don\'t have any package or your package has expired.'
                  : `You have used up ${packageLimitInfo.currentUsage}/${packageLimitInfo.totalLimit} times of Test/EQ from the package ${packageLimitInfo.packageName}.`
                }
              </p>
              
              {/* Usage Progress */}
              {packageLimitInfo.packageName !== 'Chưa có gói' && packageLimitInfo.totalLimit > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Usage</span>
                    <span>{packageLimitInfo.currentUsage}/{packageLimitInfo.totalLimit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((packageLimitInfo.currentUsage / packageLimitInfo.totalLimit) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Benefits */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Benefits of upgrading:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Unlimited practice times
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Access to all premium features
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Detailed AI feedback and personalized
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Priority support 24/7
                  </li>
                </ul>
              </div>
              
              {/* Actions */}
              <div className="space-y-3">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => {
                    window.location.href = '/Pricing';
                  }}
                >
                  <Star className="h-5 w-5 mr-2" />
                  Upgrade now
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-xl"
                  onClick={() => setShowUpgradeModal(false)}
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
