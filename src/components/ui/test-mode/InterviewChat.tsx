import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAzureVoiceInteraction } from '@/hooks/useAzureVoiceInteraction';

interface ChatMessage {
  id: string | number;
  sender: 'user' | 'ai';
  text: string;
  isError?: boolean;
}

interface InterviewChatProps {
  position: string;
  conversation: ChatMessage[];
  message: string;
  isAiThinking: boolean;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  messageListRef: React.RefObject<HTMLDivElement | null>;
  onEndInterview?: (timeLeft: number) => void;
  duration: number;
  realTimeScores: {
    fundamental: number;
    logic: number;
    language: number;
    suggestions: {
      fundamental: string;
      logic: string;
      language: string;
    };
  };
  lastFeedback?: string | null;
  isReviewing?: boolean; // Thêm prop để biết đang review
  reviewCountdown?: number; // Thêm countdown  
  officialQuestionCount?: number; // Số câu hỏi đã hỏi
  maxQuestions?: number; // Số câu hỏi tối đa
  voiceLanguage?: 'en-US' | 'vi-VN'; // Thêm prop để chọn ngôn ngữ voice
}

export const InterviewChat: React.FC<InterviewChatProps> = ({
  position,
  conversation,
  message,
  isAiThinking,
  onMessageChange,
  onSendMessage,
  messageListRef,
  onEndInterview,
  duration,
  realTimeScores,
  isReviewing = false,
  reviewCountdown = 0,
  officialQuestionCount = 0,
  maxQuestions = 10,
  voiceLanguage = 'en-US', // Default to English
}) => {
  const [secondsLeft, setSecondsLeft] = React.useState(duration * 60);
  const [currentVoiceLanguage, setCurrentVoiceLanguage] = React.useState(voiceLanguage);
  
  // Azure Speech-to-Text integration
  const {
    isListening,
    startListening,
    stopListening
  } = useAzureVoiceInteraction({
    onSpeechResult: (result: string) => {
      console.log('Speech result received:', result);
      // Append the speech result to the current message
      const newMessage = message + (message ? ' ' : '') + result;
      // Simulate onChange event for the parent component
      const fakeEvent = {
        target: { value: newMessage }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onMessageChange(fakeEvent);
    },
    onError: (error: string) => {
      console.error('Speech recognition error:', error);
    },
    language: currentVoiceLanguage // Use the selected language
  });

  React.useEffect(() => {
    setSecondsLeft(duration * 60);
  }, [duration]);
  React.useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const timer = `${mm}:${ss}`;

  // Sử dụng realTimeScores nếu có, fallback về 0
  const scores = realTimeScores || {
    fundamental: 0,
    logic: 0,
    language: 0,
    suggestions: {
      fundamental: '',
      logic: '',
      language: ''
    }
  };

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [conversation, messageListRef]);

  // Find the latest AI evaluation message (contains '**Đánh giá câu trả lời:**')
  const latestEvaluation = [...conversation].reverse().find(
    (msg) => msg.sender === 'ai' && msg.text && msg.text.includes('**Đánh giá câu trả lời:**')
  );

  // Lọc conversation để KHÔNG render đánh giá trong khung chat
  const filteredConversation = conversation.filter(
    (msg) => !(msg.sender === 'ai' && msg.text && msg.text.includes('**Đánh giá câu trả lời:**'))
  );

  React.useEffect(() => {
    if (secondsLeft === 0 && onEndInterview) {
      onEndInterview(0);
    }
  }, [secondsLeft, onEndInterview]);

  // Timer color logic
  const percentLeft = secondsLeft / (duration * 60);
  let timerColor = 'text-green-600';
  if (percentLeft <= 0.33) {
    timerColor = 'text-red-600';
  } else if (percentLeft <= 0.66) {
    timerColor = 'text-yellow-500';
  }

  // Toggle real-time score popover
  const [showRealtimePopover, setShowRealtimePopover] = React.useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = React.useState(false);

  return (
    <div className="flex flex-col h-[calc(100vh-61px)] overflow-hidden px-2 pt-30">
      {/* Chat + header + timer */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="mb-2 rounded-xl border border-gray-200 bg-white shadow-sm relative">
          <div className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Interview in Progress</h2>
              <Badge variant="outline" className="border-blue-200 text-blue-700">{position}</Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Question {officialQuestionCount}/{maxQuestions}
              </Badge>
              {/* Realtime Score Toggle */}
              <button
                type="button"
                onClick={() => setShowRealtimePopover((v) => !v)}
                className="ml-auto inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-500 hover:bg-red-600 text-white shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                title="Show real-time scores"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </button>
              <Button
                variant="outline"
                className="h-7 px-2 py-0 text-xs ml-2"
                onClick={() => onEndInterview && onEndInterview(secondsLeft / 60)}
              >
                End interview
              </Button>
              <span className={`ml-2 inline-flex items-center gap-1 font-mono text-lg ${timerColor}`}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="#888" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="#888" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {timer}
              </span>
              {isReviewing && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 animate-pulse">
                  Review Time: {reviewCountdown}s
                </Badge>
              )}
            </div>
          </div>
          {/* Popover Panel */}
          {showRealtimePopover && (
            <div className="absolute right-3 top-12 z-20 w-80 rounded-xl border border-gray-200 bg-white shadow-xl p-4">
              <div className="font-semibold text-gray-900 mb-3">Real-time Assessment</div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="text-gray-700">Fundamental</span>
                    <span className="font-semibold text-blue-600">{Math.round(scores.fundamental)}%</span>
                  </div>
                  <ScoreBar value={scores.fundamental} color="bg-blue-500" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="text-gray-700">Logic</span>
                    <span className="font-semibold text-red-500">{Math.round(scores.logic)}%</span>
                  </div>
                  <ScoreBar value={scores.logic} color="bg-red-500" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="text-gray-700">Language</span>
                    <span className="font-semibold text-green-600">{Math.round(scores.language)}%</span>
                  </div>
                  <ScoreBar value={scores.language} color="bg-green-500" />
                </div>
              </div>
            </div>
          )}
          {/* Question Progress (compact) */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Question Progress</span>
              <span className="text-sm font-semibold text-blue-600">{Math.round((officialQuestionCount / (maxQuestions || 1)) * 100)}%</span>
            </div>
            <Progress value={(officialQuestionCount / (maxQuestions || 1)) * 100} />
          </div>
        </div>
        <Card className="flex-1 min-h-0 flex flex-col bg-white border border-gray-200 shadow-sm">
          <CardContent className="flex-1 min-h-0 flex flex-col p-3 bg-gray-50/30 overflow-y-auto" ref={messageListRef}>
            {filteredConversation.map((msg) => (
              <div key={msg.id} className={`mb-3 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}> 
                <div className={`rounded-2xl px-3 py-2 max-w-[72%] shadow-sm ${msg.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white border border-gray-200 text-gray-800'}`}>
                  <div className="text-[11px] font-medium opacity-70 mb-1">{msg.sender === 'user' ? 'You' : 'AI Interviewer'}</div>
                  <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
                </div>
              </div>
            ))}
            {isAiThinking && (
              <div className="mb-3 flex justify-start">
                <div className="rounded-2xl px-3 py-2 bg-white border border-gray-200 text-gray-800 max-w-[54%] shadow-sm">
                  <div className="text-[11px] font-medium opacity-70 mb-1">AI Interviewer</div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                    <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
                    <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-2 border-t border-gray-200 bg-white">
            <div className="relative">
              <div className="flex items-center gap-2 bg-gray-100 rounded-2xl p-2 border border-gray-200">
                {/* Plus Button */}
                <button
                  className="p-2 text-gray-600 hover:text-gray-900"
                  title="More options"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>

                {/* Textarea */}
                <div className="relative flex-1">
                  <Textarea
                    placeholder={
                      isReviewing 
                        ? (currentVoiceLanguage === 'vi-VN' ? 'Vui lòng chờ trong khi đánh giá...' : 'Please wait while reviewing...')
                        : (currentVoiceLanguage === 'vi-VN' ? 'Nhập câu trả lời hoặc sử dụng microphone...' : 'Enter your answer or use microphone...')
                    }
                    value={message}
                    onChange={onMessageChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (message.trim() && !isAiThinking && !isReviewing) {
                          onSendMessage();
                        }
                      }
                    }}
                    rows={1}
                    className="flex-1 min-h-[20px] max-h-28 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm text-gray-900 placeholder:text-gray-500"
                    disabled={isAiThinking || isReviewing}
                  />
                </div>

                {/* Mic Settings (Language) */}
                <div className="relative">
                  <button
                    onClick={() => setShowLanguageMenu((v) => !v)}
                    disabled={isAiThinking || isReviewing}
                    className="p-2 rounded-md text-gray-600 hover:text-gray-900"
                    title={currentVoiceLanguage === 'vi-VN' ? 'Ngôn ngữ micro: Tiếng Việt' : 'Mic language: English'}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.26 1.3.73 1.77.47.47 1.11.73 1.77.73H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  </button>
                  {showLanguageMenu && (
                    <div className="absolute bottom-9 right-0 z-20 w-40 rounded-md border border-gray-200 bg-white shadow-md text-sm">
                      <button
                        className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${currentVoiceLanguage === 'vi-VN' ? 'font-semibold text-blue-600' : ''}`}
                        onClick={() => {
                          setCurrentVoiceLanguage('vi-VN');
                          setShowLanguageMenu(false);
                          if (isListening) {
                            stopListening();
                          }
                        }}
                      >
                        Tiếng Việt (vi-VN)
                      </button>
                      <button
                        className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${currentVoiceLanguage === 'en-US' ? 'font-semibold text-blue-600' : ''}`}
                        onClick={() => {
                          setCurrentVoiceLanguage('en-US');
                          setShowLanguageMenu(false);
                          if (isListening) {
                            stopListening();
                          }
                        }}
                      >
                        English (en-US)
                      </button>
                    </div>
                  )}
                </div>

                {/* Mic Button */}
                <button
                  onClick={() => {
                    if (isListening) {
                      stopListening();
                    } else {
                      startListening();
                    }
                  }}
                  disabled={isAiThinking || isReviewing}
                  className={`p-2 rounded-md transition-colors ${isListening ? 'text-red-500' : 'text-gray-600 hover:text-gray-900'}`}
                  title={isListening ? 'Stop recording' : 'Start voice input'}
                >
                  {isListening ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="4" width="6" height="11" rx="3"></rect><line x1="12" y1="19" x2="12" y2="22"></line><line x1="8" y1="22" x2="16" y2="22"></line></svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="11" rx="3"></rect><line x1="12" y1="13" x2="12" y2="19"></line><path d="M5 10v2a7 7 0 0 0 14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line><line x1="8" y1="22" x2="16" y2="22"></line></svg>
                  )}
                </button>

                {/* Send Button */}
                <Button 
                  onClick={onSendMessage} 
                  disabled={!message.trim() || isAiThinking || isReviewing} 
                  variant="ghost"
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </Button>
              </div>

              {/* Recording indicator */}
              {isListening && (
                <div className="absolute -top-8 left-0 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  Recording...
                </div>
              )}
            </div>
          </div>
          
          {/* bottom helper line removed as requested */}
        </Card>
      </div>
    </div>
  );
};

// Compact score bar with rounded background and colored fill
const ScoreBar: React.FC<{ value: number; color?: string }> = ({ value, color = 'bg-blue-500' }) => {
  const safe = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div className="w-full">
      <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`${color} h-full transition-all`}
          style={{ width: `${safe}%` }}
        />
      </div>
      <div className="mt-1 text-[11px] text-gray-500">Score: {safe}/100</div>
    </div>
  );
};