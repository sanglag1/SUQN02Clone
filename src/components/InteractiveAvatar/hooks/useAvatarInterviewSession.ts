import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useConversation } from './useConversation';
import { useAvatarControl } from './useAvatarControl';
import { useAIConversation } from './useAIConversation';
import { useInterviewApi } from './useInterviewApi';
import { useInterviewSession } from './useInterviewSession';
import { generateInterviewEvaluation } from '@/services/evaluationService';
import { AVATARS } from '../HeygenConfig';
import { ChatMessage } from '@/services/openaiService';
import { mapUILanguageToAI } from '@/utils/languageMapping';
import { AvatarQuality, VoiceEmotion, StartAvatarRequest, ElevenLabsModel } from '@heygen/streaming-avatar';

// Local type definitions
interface ConversationMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  isError?: boolean;
}

interface ApiConversationMessage {
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
}

interface JobRole {
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
  };
  categoryId?: string;
  specialization?: {
    id: string;
    name: string;
  };
  specializationId?: string;
}

export interface Interview {
  id: string;
  userId: string;
  jobRoleId: string;
  jobRole: {
    title: string;
    level: string;
    displayName: string;
  };
  language: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: string;
  progress: number;
  questionCount: number;
  coveredTopics: string[];
  conversationHistory?: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  evaluation?: {
    overallRating: number;
    technicalScore: number;
    communicationScore: number;
    problemSolvingScore: number;
    recommendations?: string[];
  };
  skillAssessment?: Record<string, number>;
}

const DEFAULT_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.High,
  avatarName: AVATARS[0].avatar_id,
  knowledgeId: undefined,
  voice: {
    rate: 1.0,
    emotion: VoiceEmotion.EXCITED,
    model: ElevenLabsModel.eleven_flash_v2_5
  },
  language: 'vi',
};

export function useAvatarInterviewSession({ onEndSession }: { onEndSession: (data: Interview) => void }) {
  const router = useRouter();
  const { userId, isLoaded, isSignedIn, getToken } = useAuth();
  const [config, setConfig] = useState<StartAvatarRequest>(DEFAULT_CONFIG);
  const [connectionQuality, setConnectionQuality] = useState('UNKNOWN');
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [isAvatarTalking, setIsAvatarTalking] = useState(false);
  const [message, setMessage] = useState('');
  const [aiConversationHistory, setAiConversationHistory] = useState<ChatMessage[]>([]);
  const [positionKey, setPositionKey] = useState<string>('');
  const [jobRoleId, setJobRoleId] = useState<string>('');
  const [pendingInterviewEnd, setPendingInterviewEnd] = useState<null | { progress: number; reason?: string }>(null);
  const [isSavingInterview, setIsSavingInterview] = useState(false);
  const [isInitializingInterview, setIsInitializingInterview] = useState(false);
  const isPositionsFetching = useRef(false);

  const { fetchJobRoles, saveInterview } = useInterviewApi();
  const {
    isInterviewComplete,
    setIsInterviewComplete,
    isSubmitting,
    setIsSubmitting,
    interviewStartTime,
    setInterviewStartTime,
    elapsedTime,
    setElapsedTime,
    formatElapsedTime,
  } = useInterviewSession();

  useEffect(() => {
      const fetchJobRolesOnce = async () => {
    if (isPositionsFetching.current) return;
    isPositionsFetching.current = true;
    try {
      const data: JobRole[] = await fetchJobRoles();
      setJobRoles(data);
    } catch (error) {
      console.error('Error fetching job roles:', error);
    } finally {
      isPositionsFetching.current = false;
    }
  };
    fetchJobRolesOnce();
  }, [fetchJobRoles]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect=/interview');
    }
  }, [isLoaded, isSignedIn, router]);

  const {
    conversation,
    addMessage,
    updateTranscript,
    finalizeTranscript,
    clearPartialMessages,
    clearConversation
  } = useConversation();

  const {
    sessionState,
    videoRef,
    startSession,
    endSession,
    speakText,
    stopAvatarSpeaking,
    canInterrupt,
    isInterrupting
  } = useAvatarControl({
    onAvatarTalkingChange: setIsAvatarTalking,
    onConnectionQualityChange: setConnectionQuality,
    onTranscriptUpdate: updateTranscript,
    onTranscriptFinalize: finalizeTranscript,
    onTranscriptStart: clearPartialMessages,
    onAvatarMessage: (text) => addMessage(text, 'ai'),
    onError: (message) => addMessage(message, 'system', true)
  });



  // Tạo config cho question bank integration
  const questionBankConfig = {
    field: jobRoles.find(role => role.id === jobRoleId)?.category?.name || 'software development',
    level: jobRoles.find(role => role.id === jobRoleId)?.level || 'mid',
    language: mapUILanguageToAI(config.language || 'en'),
    jobRoleTitle: jobRoles.find(role => role.id === jobRoleId)?.title,
    jobRoleLevel: jobRoles.find(role => role.id === jobRoleId)?.level
  };

  // Log config để debug
  console.log('🔗 Question Bank Config created:', questionBankConfig);

  const {
    isThinking,
    processMessage: aiProcessMessage,
    startNewInterview: aiStartNewInterview,
    questionCount,
    interviewState,
    autoPromptCount,
    isAutoPromptActive,
    resetAutoPrompt,
    startAutoPromptTimer,
    clearAutoPromptTimer,
    resetInterviewSession
  } = useAIConversation({
    onAnswer: async (text: string) => {
      addMessage(text, 'ai');
      await speakText(text);
    },
    onError: (error: string) => {
      console.error('AI error:', error);
      addMessage(error, 'system', true);
    },
    onFollowUpQuestion: (question: string) => {
      addMessage(question, 'system');
    },
    onInterviewComplete: (result) => {
      // Set interview as complete
      setIsInterviewComplete(true);
      // Nếu kết thúc do auto-prompt timeout thì thêm reason
      if (result && typeof result === 'object' && result.progress === 100 && !result.reason) {
        setPendingInterviewEnd({ ...result, reason: 'timeout' });
      } else {
        setPendingInterviewEnd(result);
      }
    },
    language: mapUILanguageToAI(config.language || 'en'),
    isInterviewComplete: isInterviewComplete,
    config: questionBankConfig
  });


  // Effect: Start auto-prompt timer only after avatar stops talking
  const prevIsAvatarTalking = useRef(isAvatarTalking);

  // Đặt handleEndSession lên trước để tránh lỗi hoisting

  useEffect(() => {
    // Khi avatar vừa chuyển từ nói sang im lặng, bắt đầu auto-prompt timer
    if (prevIsAvatarTalking.current && !isAvatarTalking && !isThinking && !isInterviewComplete) {
      // Chỉ start auto-prompt timer nếu phỏng vấn chưa kết thúc
      startAutoPromptTimer();
    }
    // Nếu avatar bắt đầu nói lại, clear timer
    if (isAvatarTalking) {
      clearAutoPromptTimer();
    }
    // Nếu phỏng vấn đã kết thúc, clear timer
    if (isInterviewComplete) {
      clearAutoPromptTimer();
    }
    prevIsAvatarTalking.current = isAvatarTalking;
  }, [isAvatarTalking, isThinking, isInterviewComplete, startAutoPromptTimer, clearAutoPromptTimer]);

  // Reset auto-prompt timer khi user trả lời (gọi resetAutoPrompt như cũ)

  useEffect(() => {
    const messages = conversation as unknown as ConversationMessage[];
    const convertedHistory: ChatMessage[] = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 
            msg.sender === 'ai' ? 'assistant' : 'system',
      content: msg.text
    }));
    setAiConversationHistory(convertedHistory);
  }, [conversation]);

  const initializeSession = useCallback(async () => {
    // Kiểm tra điều kiện bắt buộc
    if (!jobRoleId) {
      addMessage('Vui lòng chọn vị trí công việc trước khi bắt đầu phỏng vấn.', 'system', true);
      return;
    }
    setIsInitializingInterview(true);
    try {
      setIsInterviewComplete(false);
      setInterviewStartTime(new Date());
      setElapsedTime(0);
      await startSession(config);
      
      // Tìm job role với đầy đủ thông tin
      const selectedJobRole = jobRoles.find(role => role.id === jobRoleId);
      
      if (selectedJobRole) {
        // Tạo context chi tiết hơn cho AI
        const aiContext = {
          jobRole: selectedJobRole.title,
          level: selectedJobRole.level,
          category: selectedJobRole.category?.name,
          specialization: selectedJobRole.specialization?.name,
          requirements: selectedJobRole.description,
          experienceYears: `${selectedJobRole.minExperience}-${selectedJobRole.maxExperience || selectedJobRole.minExperience + 2}`
        };
        
        console.log('🎯 AI Context for interview:', aiContext);
        
        // Normalize position name for AI to avoid confusion
        const normalizedPosition = selectedJobRole.category?.name
          ?.replace(/\s*Development?\s*/gi, '') // Remove "Development" or "Dev"
          ?.replace(/\s*Engineering?\s*/gi, '') // Remove "Engineering"
          ?.trim() || selectedJobRole.title.toLowerCase();
        
        console.log('Starting interview with normalized field:', normalizedPosition, 'specialization:', selectedJobRole.specialization?.name, 'level:', selectedJobRole.level, 'experience:', `${selectedJobRole.minExperience}-${selectedJobRole.maxExperience || selectedJobRole.minExperience + 2} years`);
        
        // Log config trước khi gọi AI
        const aiConfig = {
          field: normalizedPosition,
          level: selectedJobRole.level,
          specialization: selectedJobRole.specialization?.name,
          minExperience: selectedJobRole.minExperience,
          maxExperience: selectedJobRole.maxExperience || selectedJobRole.minExperience + 2,
          jobRoleTitle: selectedJobRole.title,
          jobRoleLevel: selectedJobRole.level
        };
        console.log('🎯 Calling AI with config:', aiConfig);
        
        // Gọi AI với context đầy đủ
        await aiStartNewInterview(
          normalizedPosition, 
          selectedJobRole.level, 
          selectedJobRole.specialization?.name, 
          selectedJobRole.minExperience, 
          selectedJobRole.maxExperience || selectedJobRole.minExperience + 2
        );
      } else {
        addMessage('Không tìm thấy thông tin vị trí công việc. Vui lòng thử lại.', 'system', true);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      addMessage('Failed to start session: ' + (error instanceof Error ? error.message : String(error)), 'system', true);
    } finally {
      setIsInitializingInterview(false);
    }
  }, [jobRoleId, jobRoles, setIsInterviewComplete, setInterviewStartTime, setElapsedTime, startSession, config, aiStartNewInterview, addMessage]);

  const handleInterviewCompleteInternal = useCallback(async (progress: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
   // Bắt đầu loading lưu kết quả
    setIsInterviewComplete(true);
    if (!isLoaded) {
      setIsSubmitting(false);
      setIsSavingInterview(false);
      return;
    }
    if (!isSignedIn || !userId) {
      router.push('/sign-in?redirect=/interview');
      setIsSubmitting(false);
      setIsSavingInterview(false);
      return;
    }
    try {
      // Get selected job role for evaluation
      const selectedJobRole = jobRoles.find(role => role.id === jobRoleId);
      const positionName = selectedJobRole?.title || 'Unknown Position';
      const positionLevel = selectedJobRole?.level || 'Unknown Level';
      
      const evaluation = await generateInterviewEvaluation(
        aiConversationHistory,
        positionName,
        positionLevel,
        mapUILanguageToAI(config.language || 'en')
      );
      const messages = conversation as unknown as ConversationMessage[];
      // Ensure every message has a valid timestamp string
      const apiConversation: ApiConversationMessage[] = messages.map(msg => ({
        role: msg.sender,
        content: msg.text,
        timestamp: (msg.timestamp && typeof msg.timestamp === 'string') ? msg.timestamp : new Date().toISOString()
      }));
      // Fallback for startTime if missing or invalid
      let startTime: Date;
      if (interviewStartTime) {
        startTime = interviewStartTime;
      } else if (messages[0] && messages[0].timestamp && !isNaN(Date.parse(messages[0].timestamp))) {
        startTime = new Date(messages[0].timestamp);
      } else {
        startTime = new Date();
      }
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const token = await getToken();
      const requestData = {
        jobRoleId: jobRoleId,
        language: mapUILanguageToAI(config.language || 'en'),
        startTime: interviewStartTime || startTime,
        endTime,
        duration,
        conversationHistory: apiConversation,
        evaluation,
        questionCount: questionCount,
        coveredTopics: interviewState.coveredTopics,
        skillAssessment: interviewState.skillAssessment,
        progress,
        status: 'completed'
      };
      setIsSavingInterview(true); 
      if (!token) throw new Error('No auth token');
      console.log('Saving interview with data:', requestData);
      const savedInterview = await saveInterview(requestData, token);
      console.log('Saved interview response:', savedInterview);
      const interviewId = savedInterview.id || savedInterview._id || savedInterview.interviewId;
      if (!interviewId) {
        console.error('Interview response:', savedInterview);
        throw new Error('Không lấy được id buổi phỏng vấn!');
      }
      await endSession();
      setIsAvatarTalking(false);
      setMessage('');
      
      // Tự động chuyển đến trang evaluation sau khi lưu thành công
      // Thêm delay ngắn để người dùng thấy thông báo "Đã lưu thành công"
      console.log('Redirecting to evaluation page with interviewId:', interviewId);
      setTimeout(() => {
        const evaluationUrl = `/avatar-interview/evaluation?id=${interviewId}`;
        console.log('Navigating to:', evaluationUrl);
        // Sử dụng window.location.href để đảm bảo chuyển hướng hoạt động
        window.location.href = evaluationUrl;
      }, 1000);
      
      // Gọi onEndSession sau khi đã setup chuyển hướng
      const interviewData = {
        id: interviewId || '',
        userId: userId || '',
        jobRoleId: jobRoleId || '',
        jobRole: {
          title: positionName || '',
          level: selectedJobRole?.level || '',
          displayName: positionName || ''
        },
        language: config.language || '',
        startTime: (interviewStartTime || startTime) ?? new Date(),
        endTime: endTime ?? new Date(),
        duration: duration ?? 0,
        status: 'completed',
        progress: progress ?? 0,
        questionCount: questionCount ?? 0,
        coveredTopics: interviewState.coveredTopics ?? [],
        conversationHistory: apiConversation ?? [],
        evaluation: evaluation,
        skillAssessment: interviewState.skillAssessment
      };
      
      // Gọi onEndSession với data để component cha có thể xử lý
      onEndSession(interviewData);
    } catch (error) {
      console.error('Error during interview completion:', error);
      addMessage(
        config.language === 'vi'
          ? 'Đã xảy ra lỗi khi lưu kết quả phỏng vấn. Vui lòng kiểm tra đăng nhập và thử lại.'
          : config.language === 'zh'
          ? '保存面试结果时发生错误。请检查登录并重试。'
          : config.language === 'ja'
          ? '面接結果の保存中にエラーが発生しました。ログインを確認して再試行してください。'
          : config.language === 'ko'
          ? '면접 결과 저장 중 오류가 발생했습니다. 로그인을 확인하고 다시 시도해 주세요.'
          : 'Error saving interview results. Please check your login and try again.',
        'system',
        true
      );
    } finally {
      setIsSubmitting(false);
      setIsSavingInterview(false); // Kết thúc loading lưu kết quả
    }
  }, [isSubmitting, setIsSubmitting, setIsInterviewComplete, isLoaded, isSignedIn, userId, router, aiConversationHistory, jobRoleId, jobRoles, config, conversation, interviewStartTime, getToken, saveInterview, questionCount, interviewState, endSession, setIsAvatarTalking, setMessage, onEndSession, addMessage]);


  // Đặt handleEndSession lên trước để tránh lỗi hoisting
  const isEndingSession = useRef(false);

  const handleEndSession = useCallback(async () => {
    if (isEndingSession.current) return;
    isEndingSession.current = true;
    try {
      if (isAvatarTalking && stopAvatarSpeaking) {
        await stopAvatarSpeaking();
        // Đợi một chút để đảm bảo avatar đã dừng hoàn toàn
        await new Promise(res => setTimeout(res, 300));
      }
      resetInterviewSession();
      setIsAvatarTalking(false);
      setMessage('');
      await endSession();
      clearConversation();
      addMessage('Session ended', 'system');
      setInterviewStartTime(null);
      setElapsedTime(0);
      onEndSession({
        id: '',
        userId: userId || '',
        jobRoleId: '',
        jobRole: {
          title: '',
          level: '',
          displayName: ''
        },
        language: config.language || '',
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        status: 'cancelled',
        progress: 0,
        questionCount: 0,
        coveredTopics: [],
        conversationHistory: [],
        evaluation: undefined,
        skillAssessment: undefined
      });
    } catch (error) {
      console.error('Error ending session:', error);
      addMessage('Failed to end session properly: ' + (error instanceof Error ? error.message : String(error)), 'system', true);
      setIsAvatarTalking(false);
      setMessage('');
      setInterviewStartTime(null);
      setElapsedTime(0);
    }
  }, [isAvatarTalking, stopAvatarSpeaking, resetInterviewSession, endSession, onEndSession, addMessage, clearConversation, userId, config.language, setElapsedTime, setInterviewStartTime]);

  useEffect(() => {
    if (pendingInterviewEnd !== null && !isAvatarTalking) {
      const timeout = setTimeout(async () => {
        if (pendingInterviewEnd.reason === 'timeout') {
          // Gọi handleEndSession để reset toàn bộ UI và state như khi nhấn nút End Session
          await handleEndSession();
        } else {
          handleInterviewCompleteInternal(pendingInterviewEnd.progress);
        }
        setPendingInterviewEnd(null);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [pendingInterviewEnd, isAvatarTalking, handleInterviewCompleteInternal, handleEndSession]);

  const handleInterruptAvatar = useCallback(async () => {
    try {
      if (isAvatarTalking && canInterrupt()) {
        await stopAvatarSpeaking();
      }
    } catch (error) {
      console.error('Error interrupting avatar:', error);
    }
  }, [isAvatarTalking, canInterrupt, stopAvatarSpeaking]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isAvatarTalking || isThinking || isInterviewComplete) return;
    try {
      const textToSpeak = message;
      setMessage('');
      addMessage(textToSpeak, 'user');
      const mappedHistory = [...conversation, {
        id: '',
        sender: 'user',
        text: textToSpeak,
        timestamp: new Date().toISOString()
      }].map(msg => ({
        role: msg.sender === 'user' ? 'user' : msg.sender === 'ai' ? 'assistant' : 'system' as 'user' | 'assistant' | 'system',
        content: msg.text
      }));
      await aiProcessMessage(textToSpeak, mappedHistory);
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('Gửi tin nhắn thất bại: ' + (error instanceof Error ? error.message : String(error)), 'system', true);
    }
  }, [message, isAvatarTalking, isThinking, isInterviewComplete, addMessage, aiProcessMessage, conversation]);

  const handleSpeechResult = useCallback((text: string) => {
    if (!text.trim()) return;
    if (isAvatarTalking) return;
    if (isInterviewComplete) return;
    addMessage(text, 'user');
    const mappedHistory = [...conversation, {
      id: '',
      sender: 'user',
      text: text,
      timestamp: new Date().toISOString()
    }].map(msg => ({
      role: msg.sender === 'user' ? 'user' : msg.sender === 'ai' ? 'assistant' : 'system' as 'user' | 'assistant' | 'system',
      content: msg.text
    }));
    setTimeout(() => {
      aiProcessMessage(text, mappedHistory).catch((error) => {
        console.error('Error processing speech with AI:', error);
        addMessage('Failed to process speech: ' + error.message, 'system', true);
      });
    }, 0);
  }, [isAvatarTalking, isInterviewComplete, addMessage, aiProcessMessage, conversation]);

  return {
    config, setConfig,
    connectionQuality,
    jobRoles,
    isAvatarTalking,
    message, setMessage,
    aiConversationHistory,
    positionKey, setPositionKey,
    jobRoleId, setJobRoleId,
    pendingInterviewEnd, setPendingInterviewEnd,
    isInterviewComplete,
    isSubmitting,
    interviewStartTime,
    elapsedTime,
    formatElapsedTime,
    sessionState,
    videoRef,
    initializeSession,
    handleEndSession,
    handleSendMessage,
    handleSpeechResult,
    conversation,
    addMessage,
    isThinking,
    interviewState,
    questionCount,
    handleInterruptAvatar,
    canInterrupt,
    isInterrupting,
    isSavingInterview,
    isInitializingInterview,
    // Auto-prompt states
    autoPromptCount,
    isAutoPromptActive,
    resetAutoPrompt,
  }; 
} 