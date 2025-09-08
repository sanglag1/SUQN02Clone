"use client"

import React, { useRef, useEffect } from 'react';
import { Users, MessageSquare, CheckCircle, FileText, Brain, TrendingUp, Lightbulb, Activity } from "lucide-react";
import { SessionState } from '../HeygenConfig';

interface Message {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  isError?: boolean;
  isPartial?: boolean;
}

interface SkillAssessment {
  technical: number;
  communication: number;
  problemSolving: number;
}

interface ChatControlsProps {
  sessionState: SessionState;
  inputText: string;
  setInputText: (text: string) => void;
  isAvatarTalking: boolean;
  conversation: Message[];
  onSendMessage: () => Promise<void>;
  isThinking?: boolean;
  isInterviewComplete?: boolean;
  questionCount?: number;
  skillAssessment?: SkillAssessment;
  coveredTopics?: string[];
  progress?: number;
}

interface ButtonProps {
  children: React.ReactNode;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  [key: string]: unknown;
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

interface AvatarProps {
  children: React.ReactNode;
  className?: string;
}


interface AvatarFallbackProps {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = "default", size = "default", className = "", onClick, ...props }) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

  const variants: Record<string, string> = {
    default: "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500",
    ghost: "hover:bg-gray-100 hover:text-gray-900",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50",
  }

  const sizes: Record<string, string> = {
    default: "h-10 py-2 px-4",
    sm: "h-8 px-3 text-sm",
    lg: "h-12 px-8",
  }

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} onClick={onClick} {...props}>
      {children}
    </button>
  )
}

const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>{children}</div>
)

const CardContent: React.FC<CardContentProps> = ({ children, className = "" }) => <div className={`p-6 ${className}`}>{children}</div>

const Badge: React.FC<BadgeProps> = ({ children, variant = "default", className = "" }) => {
  const variants: Record<string, string> = {
    default: "bg-gray-100 text-gray-800",
    outline: "border border-gray-300 bg-transparent",
    secondary: "bg-gray-800 text-white",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

const Avatar: React.FC<AvatarProps> = ({ children, className = "" }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>{children}</div>
)


const AvatarFallback: React.FC<AvatarFallbackProps> = ({ children }) => (
  <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
    {children}
  </div>
)

const ChatControls: React.FC<ChatControlsProps> = ({
  sessionState,
  inputText,
  setInputText,
  isAvatarTalking,
  conversation,
  onSendMessage,
  isThinking = false,
  isInterviewComplete = false,
  questionCount = 0,
  skillAssessment,
  coveredTopics = [],
  progress = 0
}) => {
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const processPanelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMsgCountRef = useRef<number>(conversation.length);
  const [activeTab, setActiveTab] = React.useState("process");
  const [isUserScrolling, setIsUserScrolling] = React.useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Chỉ scroll trong panel chat khi có tin nhắn mới (không tính system messages)
  const visibleMessages = conversation.filter(msg => msg && msg.sender && msg.text && msg.sender !== 'system');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (visibleMessages.length > prevMsgCountRef.current && chatPanelRef.current && !isUserScrolling) {
      chatPanelRef.current.scrollTo({
        top: chatPanelRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
    prevMsgCountRef.current = visibleMessages.length;
  }, [visibleMessages.length, isUserScrolling]);

  // Handle user scroll to detect if they're manually scrolling
  const handleChatScroll = () => {
    if (!chatPanelRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatPanelRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
    
    setIsUserScrolling(!isAtBottom);
    
    // Reset user scrolling flag after a delay
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 1000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to bottom when switching to chat tab
  useEffect(() => {
    if (activeTab === "chat" && chatPanelRef.current) {
      setTimeout(() => {
        chatPanelRef.current?.scrollTo({
          top: chatPanelRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [activeTab]);

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey && !isAvatarTalking && !isThinking) {
      event.preventDefault();
      onSendMessage();
    }
  };

  // Calculate progress percentage
  const progressPercentage = questionCount && questionCount > 0 ? progress : 0;

  // Transform conversation messages to match new UI format
  const transformedChatMessages = visibleMessages.map((msg, index) => ({
    id: msg.id || index,
    sender: msg.sender === 'user' ? 'You' : 'AI Interviewer',
    message: msg.text,
    time: new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    avatar: msg.sender === 'user' ? undefined : "/placeholder.svg?height=32&width=32",
    isUser: msg.sender === 'user',
  }));

  // Transform skill assessment to match new UI format
  const evaluationStatus = [
    {
      category: "Technical Skills",
      icon: Brain,
      score: skillAssessment?.technical || 0,
      status: (skillAssessment?.technical || 0) >= 80 ? "excellent" : (skillAssessment?.technical || 0) >= 60 ? "good" : "average",
      feedback: "Technical knowledge and problem solving",
      color: (skillAssessment?.technical || 0) >= 80 ? "text-green-600" : (skillAssessment?.technical || 0) >= 60 ? "text-blue-600" : "text-orange-600",
      bgColor: (skillAssessment?.technical || 0) >= 80 ? "bg-green-50" : (skillAssessment?.technical || 0) >= 60 ? "bg-blue-50" : "bg-orange-50",
    },
    {
      category: "Communication",
      icon: MessageSquare,
      score: skillAssessment?.communication || 0,
      status: (skillAssessment?.communication || 0) >= 80 ? "excellent" : (skillAssessment?.communication || 0) >= 60 ? "good" : "average",
      feedback: "Clear articulation and good interaction",
      color: (skillAssessment?.communication || 0) >= 80 ? "text-green-600" : (skillAssessment?.communication || 0) >= 60 ? "text-blue-600" : "text-orange-600",
      bgColor: (skillAssessment?.communication || 0) >= 80 ? "bg-green-50" : (skillAssessment?.communication || 0) >= 60 ? "bg-blue-50" : "bg-orange-50",
    },
    {
      category: "Problem Solving",
      icon: Lightbulb,
      score: skillAssessment?.problemSolving || 0,
      status: (skillAssessment?.problemSolving || 0) >= 80 ? "excellent" : (skillAssessment?.problemSolving || 0) >= 60 ? "good" : "average",
      feedback: "Analytical thinking and solution approach",
      color: (skillAssessment?.problemSolving || 0) >= 80 ? "text-green-600" : (skillAssessment?.problemSolving || 0) >= 60 ? "text-blue-600" : "text-orange-600",
      bgColor: (skillAssessment?.problemSolving || 0) >= 80 ? "bg-green-50" : (skillAssessment?.problemSolving || 0) >= 60 ? "bg-blue-50" : "bg-orange-50",
    },
  ];

  const currentEvaluation = {
    currentQuestion: isThinking ? "AI is thinking..." : isInterviewComplete ? "Interview completed" : "Interview in progress",
    questionsCompleted: questionCount || 0,
    totalQuestions: 10, // Default total questions
    overallProgress: progressPercentage,
  };

  return (
    <div className="w-full sm:w-80 h-full bg-white border-l flex flex-col shrink-0">
      <div className="p-2 sm:p-4 flex-1 flex flex-col min-h-0">
        {/* People attending - Mobile responsive */}
        <div className="mb-2 sm:mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-xs sm:text-sm font-medium">Interview Session</span>
            </div>
            <Button size="sm" variant="ghost" className="text-purple-600 hover:bg-purple-50 p-1 text-xs">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-xs font-bold"></span>
              </div>
              <span className="text-xs ml-1 hidden sm:block">View Report</span>
            </Button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex mb-4">
          <Button
            variant={activeTab === "process" ? "default" : "ghost"}
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setActiveTab("process")}
          >
            <Activity className="w-3 h-3 mr-1" />
            Process
          </Button>
          <Button
            variant={activeTab === "chat" ? "default" : "ghost"}
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Chat
          </Button>
        </div>

        {/* Process Tab Content */}
        {activeTab === "process" ? (
          <div 
            ref={processPanelRef}
            className="flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db #f3f4f6'
            }}
          >
            <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Overall</p>
                    <p className="text-sm font-bold text-green-600">
                      {currentEvaluation.overallProgress}%
                    </p>
                  </div>
                </div>

                <div className="w-px h-8 bg-gray-300"></div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Questions</p>
                    <p className="text-sm font-bold text-blue-600">
                      {currentEvaluation.questionsCompleted}/{currentEvaluation.totalQuestions}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Live Evaluation Status */}
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Live Evaluation Status</span>
                  </div>
                </div>

                <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded mb-3">
                  <strong>Current:</strong> {currentEvaluation.currentQuestion}
                </div>

                <div className="space-y-2">
                  {evaluationStatus.map((item, index) => {
                    const IconComponent = item.icon
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${item.bgColor}`}>
                            <IconComponent className={`w-3 h-3 ${item.color}`} />
                          </div>
                          <span className="text-xs font-medium">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-200 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full ${item.score >= 80 ? "bg-green-500" : item.score >= 60 ? "bg-blue-500" : "bg-orange-500"
                                }`}
                              style={{ width: `${item.score}%` }}
                            ></div>
                          </div>
                          <Badge variant="outline" className={`text-xs ${item.color} border-current`}>
                            {item.score}%
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Covered Topics */}
            {coveredTopics && coveredTopics.length > 0 && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Covered Topics</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {coveredTopics.map((topic, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" className="text-xs bg-transparent">
                <TrendingUp className="w-3 h-3 mr-1" />
                View Report
              </Button>
              <Button size="sm" variant="outline" className="text-xs bg-transparent">
                <FileText className="w-3 h-3 mr-1" />
                Add Note
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Tab Content */}
            <div className="flex-1 flex flex-col min-h-0">
              <div 
                ref={chatPanelRef}
                onScroll={handleChatScroll}
                className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#d1d5db #f3f4f6'
                }}
              >
                {transformedChatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-2 max-w-[80%] ${msg.isUser ? "flex-row-reverse" : "flex-row"}`}>
                      {!msg.isUser && (
                        <Avatar className="w-8 h-8 shrink-0">
                          
                          <AvatarFallback>
                            {msg.sender
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`flex flex-col ${msg.isUser ? "items-end" : "items-start"}`}>
                        {!msg.isUser && <span className="text-xs font-medium text-gray-700 mb-1">{msg.sender}</span>}
                        <div
                          className={`px-3 py-2 rounded-lg text-sm break-words ${msg.isUser ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {msg.message}
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{msg.time}</span>
                      </div>
                      {msg.isUser && (
                        <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">You</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Thinking indicator */}
                {isThinking && (
                  <div className="flex justify-start">
                    <div className="flex gap-2 max-w-[80%]">
                      <Avatar className="w-8 h-8 shrink-0">
                     
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-medium text-gray-700 mb-1">AI Interviewer</span>
                        <div className="px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-800">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                            AI is thinking...
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          {new Date().toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scroll to bottom indicator */}
                {isUserScrolling && (
                  <div className="flex justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-white shadow-md"
                      onClick={() => {
                        chatPanelRef.current?.scrollTo({
                          top: chatPanelRef.current.scrollHeight,
                          behavior: 'smooth',
                        });
                        setIsUserScrolling(false);
                      }}
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Scroll to bottom
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t pt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={
                      isInterviewComplete
                        ? 'Interview completed'
                        : isAvatarTalking
                          ? 'Speaking...'
                          : isThinking
                            ? 'Thinking...'
                            : 'Type your answer...'
                    }
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sessionState !== SessionState.CONNECTED || isAvatarTalking || isThinking || isInterviewComplete}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                    ref={inputRef}
                  />
                  <Button
                    size="sm"
                    className="px-3"
                    onClick={() => onSendMessage()}
                    disabled={!inputText.trim() || sessionState !== SessionState.CONNECTED || isAvatarTalking || isThinking || isInterviewComplete}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatControls;   