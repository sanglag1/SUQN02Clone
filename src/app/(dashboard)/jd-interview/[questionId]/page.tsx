'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { questionSetService, QuestionSetData } from '@/services/questionSetService';
import { useAzureVoiceInteraction } from '@/hooks/useAzureVoiceInteraction';
import { ArrowLeft, History, Home } from 'lucide-react';
import Link from 'next/link';

interface AnalysisResult {
  feedback: string;
  detailedScores: { [key: string]: number };
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  level: 'basic' | 'intermediate' | 'advanced';
  recommendedNextLevel: 'basic' | 'intermediate' | 'advanced';
  readinessScore: number;
}

export default function InterviewQuestionPage({ params }: { params: Promise<{ questionId: string }> }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resolvedParams = React.use(params);
  
  // Initialize currentQuestionIndex from URL if available
  const getInitialQuestionIndex = () => {
    const questionIndexFromURL = searchParams.get('questionIndex');
    if (questionIndexFromURL && !isNaN(Number(questionIndexFromURL))) {
      return Number(questionIndexFromURL);
    }
    return 0;
  };
  
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [availableQuestions, setAvailableQuestions] = useState<string[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSetData[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(getInitialQuestionIndex);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState<Date | null>(null);

  // Language and menu state
  const [currentVoiceLanguage, setCurrentVoiceLanguage] = useState<'en-US' | 'vi-VN'>('en-US');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Azure Speech-to-Text integration
  const {
    isListening,
    startListening,
    stopListening
  } = useAzureVoiceInteraction({
    onSpeechResult: (result: string) => {
      console.log('Speech result received:', result);
      // Append the speech result to the current answer
      setAnswer(prev => {
        const newAnswer = prev + (prev ? ' ' : '') + result;
        // Start timing when user first starts speaking (if not already started)
        if (!answerStartTime && newAnswer.length > 0) {
          setAnswerStartTime(new Date());
        }
        return newAnswer;
      });
    },
    onError: (error: string) => {
      console.error('Speech recognition error:', error);
    },
    language: currentVoiceLanguage // Set language to English
  });


  // Initialize interview question from URL if available
  const getInitialInterviewQuestion = () => {
    const questionFromURL = searchParams.get('question');
    const typeFromURL = searchParams.get('type');
    
    if (questionFromURL && typeFromURL) {
      return {
        id: resolvedParams.questionId,
        title: questionFromURL,
        type: typeFromURL,
        description: "This question is generated based on the job description you uploaded. Focus on demonstrating relevant skills and experiences that match the requirements.",
        tips: [
          "Be specific about your relevant experience",
          "Use concrete examples and metrics when possible",
          "Connect your answer to the job requirements",
          "Show your understanding of the role and company needs"
        ]
      };
    }
    
    // Fallback to default question
    return {
      id: resolvedParams.questionId,
      title: "Tell me about your experience with React and modern frontend development",
      type: "Technical Experience",
      description: "The interviewer wants to understand your hands-on experience with React, your knowledge of modern frontend practices, and how you have applied these skills in real projects. Focus on specific examples and technologies you have used.",
      tips: [
        "Mention specific React features you have used (hooks, context, etc.)",
        "Include examples of projects you have worked on",
        "Discuss challenges you have faced and how you solved them",
        "Show knowledge of the React ecosystem and best practices"
      ]
    };
  };

  const [interviewQuestion, setInterviewQuestion] = useState(getInitialInterviewQuestion);

  // Load question sets from database
  useEffect(() => {
    const loadQuestionData = async () => {
      try {
        const questionSetId = searchParams.get('questionSetId');
        const questionFromURL = searchParams.get('question');
        const typeFromURL = searchParams.get('type');
        // const questionIndexFromURL = searchParams.get('questionIndex');
        
        let questionsToUse: string[] = [];
        let setsToUse: QuestionSetData[] = [];
        
        if (questionSetId) {
          // Load specific question set - keep questions separate
          try {
            const questionSet = await questionSetService.getQuestionSet(questionSetId);
            setsToUse = [questionSet];
            questionsToUse = questionSet.questions; // Only questions from this specific set
          } catch (error) {
            console.error('Error loading specific question set:', error);
            setErrorMessage('Question set not found. Please try again or go back to question sets.');
            // Don't fallback - keep the error state so user knows what happened
            setAvailableQuestions([]);
            setQuestionSets([]);
            return;
          }
        } else {
          // No questionSetId provided - this happens when user clicks question from newly generated JD questions
          // Load questions from localStorage instead of database
          const savedState = localStorage.getItem('jd_page_state');
          if (savedState) {
            try {
              const state = JSON.parse(savedState);
              if (state.questions && Array.isArray(state.questions) && state.questions.length > 0) {
                questionsToUse = state.questions;
                setsToUse = []; // No saved question sets
              } else {
                setErrorMessage('No questions found. Please go back and generate questions from a job description.');
                setAvailableQuestions([]);
                setQuestionSets([]);
                return;
              }
            } catch (error) {
              console.error('Error parsing localStorage state:', error);
              setErrorMessage('No question set selected. Please go back and select a specific question set to continue.');
              setAvailableQuestions([]);
              setQuestionSets([]);
              return;
            }
          } else {
            setErrorMessage('No questions available. Please go back and generate questions from a job description first.');
            setAvailableQuestions([]);
            setQuestionSets([]);
            return;
          }
        }
        
        // Set the question sets and available questions
        setQuestionSets(setsToUse);
        setAvailableQuestions(questionsToUse);
        
        // Handle question from URL (only when not navigating)
        if (!isNavigating) {
          if (questionFromURL && typeFromURL) {
            // Coming from JD question - check if we need to update currentQuestionIndex
            const questionIndexFromURL = searchParams.get('questionIndex');
            let questionIndex = 0;
            
            if (questionIndexFromURL && !isNaN(Number(questionIndexFromURL))) {
              questionIndex = Number(questionIndexFromURL);
              setCurrentQuestionIndex(questionIndex);
            } else {
              setCurrentQuestionIndex(0);
            }
            
            // Use question at correct index from questionsToUse
            const actualQuestion = questionsToUse[questionIndex] || questionFromURL;
            
            setInterviewQuestion({
              id: resolvedParams.questionId,
              title: actualQuestion,
              type: typeFromURL || "Job Description Question",
              description: "This question is generated based on the job description you uploaded. Focus on demonstrating relevant skills and experiences that match the requirements.",
              tips: [
                "Be specific about your relevant experience",
                "Use concrete examples and metrics when possible",
                "Connect your answer to the job requirements",
                "Show your understanding of the role and company needs"
              ]
            });
          } else if (questionFromURL) {
            // Coming from saved questions - find its index in the current question list
            let currentIndex = questionsToUse.findIndex(q => q === questionFromURL);
            
            // If exact match not found, try partial match for truncated questions
            if (currentIndex < 0) {
              currentIndex = questionsToUse.findIndex(q => 
                q.toLowerCase().includes(questionFromURL.toLowerCase()) || 
                questionFromURL.toLowerCase().includes(q.toLowerCase())
              );
            }
            
            if (currentIndex >= 0) {
              setCurrentQuestionIndex(currentIndex);
              // Use the full question from database, not the truncated one from URL
              const fullQuestion = questionsToUse[currentIndex];
              setInterviewQuestion({
                id: resolvedParams.questionId,
                title: fullQuestion,
                type: "Saved Question",
                description: "This question is from your saved question sets. Focus on demonstrating relevant skills and experiences that match the requirements.",
                tips: [
                  "Be specific about your relevant experience",
                  "Use concrete examples and metrics when possible",
                  "Connect your answer to the job requirements",
                  "Show your understanding of the role and company needs"
                ]
              });
            } else {
              setCurrentQuestionIndex(0);
            }
          } else {
            // Default to first question if no URL params
            setCurrentQuestionIndex(0);
          }
        }
        
      } catch {
        setErrorMessage('Failed to load questions. Please try again.');
        setAvailableQuestions([]);
        setQuestionSets([]);
      }
    };

    loadQuestionData();
  }, [searchParams, resolvedParams.questionId, isNavigating]); // Remove currentQuestionIndex to avoid loop

  // Helper function to get the next question in order
  const getNextQuestion = () => {
    if (availableQuestions.length === 0) {
      // Fallback to default question if no questions in DB
      return {
        title: "Tell me about your experience with React and modern frontend development",
        type: "Technical Experience",
        description: "The interviewer wants to understand your hands-on experience with React, your knowledge of modern frontend practices, and how you have applied these skills in real projects.",
        tips: [
          "Mention specific React features you have used (hooks, context, etc.)",
          "Include examples of projects you have worked on",
          "Discuss challenges you have faced and how you solved them",
          "Show knowledge of the React ecosystem and best practices"
        ]
      };
    }

    // Calculate next question index
    const nextIndex = currentQuestionIndex + 1;
    
    // If we've reached the end, return null to indicate no more questions
    if (nextIndex >= availableQuestions.length) {
      return null;
    }
    
    const nextQuestion = availableQuestions[nextIndex];
    
    // CRITICAL: Always ensure we're staying within current question set
    // This should always be true now since we never merge questions
    if (questionSets.length > 0) {
      const currentSet = questionSets[0]; // We only ever have one set loaded
      if (!currentSet.questions.includes(nextQuestion)) {
        console.error('CRITICAL ERROR: Next question not in current set - this should never happen!');
        return null;
      }
    }

    return {
      title: nextQuestion,
      type: "Saved Question", 
      description: "This question is from your saved question sets. Focus on demonstrating relevant skills and experiences that match the requirements.",
      tips: [
        "Be specific about your relevant experience",
        "Use concrete examples and metrics when possible",
        "Connect your answer to the job requirements",
        "Show your understanding of the role and company needs"
      ]
    };
  };

  // Helper function to get the previous question in order
  const getPreviousQuestion = () => {
    if (availableQuestions.length === 0 || currentQuestionIndex <= 0) {
      return null;
    }

    const prevIndex = currentQuestionIndex - 1;
    const prevQuestion = availableQuestions[prevIndex];
    
    // CRITICAL: Always ensure we're staying within current question set
    // This should always be true now since we never merge questions
    if (questionSets.length > 0) {
      const currentSet = questionSets[0]; // We only ever have one set loaded
      if (!currentSet.questions.includes(prevQuestion)) {
        console.error('CRITICAL ERROR: Previous question not in current set - this should never happen!');
        return null;
      }
    }

    return {
      title: prevQuestion,
      type: "Saved Question",
      description: "This question is from your saved question sets. Focus on demonstrating relevant skills and experiences that match the requirements.",
      tips: [
        "Be specific about your relevant experience",
        "Use concrete examples and metrics when possible",
        "Connect your answer to the job requirements",
        "Show your understanding of the role and company needs"
      ]
    };
  };
  useEffect(() => {
    // Load questions answered count from localStorage only once
    const savedCount = localStorage.getItem('questionsAnsweredToday');
    if (savedCount) {
      setQuestionsAnswered(parseInt(savedCount, 10));
    }
  }, []); // Only run once on mount

  // Save questions answered count to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('questionsAnsweredToday', questionsAnswered.toString());
  }, [questionsAnswered]);

  const analyzeAnswer = async () => {
    if (!answer.trim()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/jd/analyze-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: interviewQuestion.title,
          answer: answer,
          type: interviewQuestion.type
        }),
      });

      const data = await response.json();
    
      
      if (data.success) {
        
        setFeedback(data.feedback);
        setAnalysisResult(data);
        setIsSubmitted(true);
        
        // Save answer to database after successful analysis
        
        await saveAnswerToDatabase(data);
        
      } else {
        console.error('❌ Analysis failed:', data.error);
      }
    } catch (error) {
      console.error('Failed to analyze answer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to save answer and analysis to database
  const saveAnswerToDatabase = async (analysisData: AnalysisResult) => {
    try {
      
      
      // Get current question set ID from localStorage or URL
      const questionSetIdFromURL = searchParams.get('questionSetId');
      
      
      let jdQuestionSetId = questionSetIdFromURL;
      
      // If no question set ID from URL, try to get from localStorage
      if (!jdQuestionSetId) {
        const savedState = localStorage.getItem('jd_page_state');

        if (savedState) {
          const state = JSON.parse(savedState);
          jdQuestionSetId = state.currentQuestionSetId;
          
        }
      }
      
      // If still no question set ID, skip saving
      if (!jdQuestionSetId) {
        return;
      }


      const timeSpent = answerStartTime ? 
        Math.floor((new Date().getTime() - answerStartTime.getTime()) / 1000) : undefined;

      // First, check if this question has been answered before
      const checkResponse = await fetch(`/api/jd-answers?type=check&questionSetId=${jdQuestionSetId}&questionIndex=${currentQuestionIndex}`);
      const checkData = await checkResponse.json();
      
      const answerData = {
        jdQuestionSetId,
        questionIndex: currentQuestionIndex,
        questionText: interviewQuestion.title,
        userAnswer: answer,
        analysisResult: {
          feedback: analysisData.feedback,
          detailedScores: analysisData.detailedScores || {},
          overallScore: analysisData.readinessScore || 0,
          strengths: analysisData.strengths || [],
          improvements: analysisData.improvements || [],
          skillAssessment: {
            level: analysisData.level,
            recommendedNextLevel: analysisData.recommendedNextLevel,
            suggestions: analysisData.suggestions
          }
        },
        timeSpent
      };

      let saveResponse;
      
      if (checkData.success && checkData.exists) {
        // Update existing answer
       
        saveResponse = await fetch(`/api/jd-answers/${checkData.answerId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(answerData),
        });
      } else {
        
        saveResponse = await fetch('/api/jd-answers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(answerData),
        });
      }

      const saveData = await saveResponse.json();
  
      
      if (saveData.success) {
       
      } else {
        console.error('❌ Failed to save answer:', saveData.error);
      }
    } catch (error) {
      console.error('Error saving answer to database:', error);
    }
  };

  const handleSubmit = () => {
    // Record the time when user starts submitting if not already recorded
    if (!answerStartTime) {
      setAnswerStartTime(new Date());
    }
    
    analyzeAnswer();
    // Increment questions answered when submitting
    setQuestionsAnswered(prev => prev + 1);
  };

     return (
     <DashboardLayout>
       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
         {/* Navigation Header */}
         <div>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Back to JD Analysis button */}
                <button
                  onClick={() => {
                    const returnUrl = searchParams.get('returnUrl');
                    if (returnUrl) {
                      router.push(decodeURIComponent(returnUrl));
                    } else {
                      router.push('/jd');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to JD Analysis
                </button>
                
                {/* Home button */}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-medium"
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </Link>
              </div>
              
              <div className="flex items-center gap-3">
                {/* View History button */}
                <Link
                  href="/jd-interview-history"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  <History className="w-4 h-4" />
                  View History
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-6">
          {/* Error Message Banner */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-red-800">
                    {errorMessage}
                  </p>
                  {errorMessage.includes('No question set selected') && (
                    <div className="mt-3">
                      <button
                        onClick={() => window.location.href = '/jd'}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Go to Question Sets
                      </button>
                    </div>
                  )}
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="max-w-[1600px] mx-auto">
            {/* Main Content Area - 2 Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
              {/* Left Column - Interview Question & Answer Input */}
              <div className="lg:col-span-3 space-y-6">
                {/* Interview Question Box */}
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm font-semibold">
                      {interviewQuestion.type}
                    </span>
                  </div>
                  <h3 className="text-orange-600 font-semibold mb-6 text-2xl">
                    {interviewQuestion.title}
                  </h3>
                  <div className="text-gray-700 leading-relaxed mb-6 text-lg">
                    {interviewQuestion.description}
                  </div>
                  
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
                  <div className="mb-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Your Answer</h4>
                    <p className="text-gray-600">Write your response below or use the microphone to speak your answer. Be specific and use examples from your experience.</p>
                  </div>
                  
                  <div className="relative">
                    {/* Modern Input UI inspired by InterviewChat */}
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
                        <textarea
                          value={answer}
                          onChange={(e) => {
                            setAnswer(e.target.value);
                            // Start timing when user first starts typing
                            if (!answerStartTime && e.target.value.length === 1) {
                              setAnswerStartTime(new Date());
                            }
                          }}
                          onInput={(e) => {
                            const el = e.currentTarget;
                            el.style.height = 'auto';
                            el.style.height = `${el.scrollHeight}px`;
                          }}
                          placeholder="Type your answer here or click the microphone to speak... Be specific and include examples from your experience."
                          disabled={isSubmitted}
                          rows={3}
                          className="w-full flex-1 min-h-[112px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 outline-none p-0 text-sm text-gray-900 placeholder:text-gray-500 overflow-y-hidden"
                          style={{ height: 'auto' }}
                        />
                      </div>

                      {/* Language Selector */}
                      <div className="relative">
                        <button
                          onClick={() => setShowLanguageMenu((v) => !v)}
                          disabled={isSubmitted}
                          className="p-2 rounded-md text-gray-600 hover:text-gray-900"
                          title="Select language for voice input"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.26 1.3.73 1.77.47.47 1.11.73 1.77.73H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
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

                      {/* Microphone Button */}
                      <button
                        onClick={() => {
                          if (isListening) {
                            stopListening();
                          } else {
                            startListening();
                          }
                        }}
                        disabled={isSubmitted}
                        className={`p-2 rounded-md transition-colors ${isListening ? 'text-red-500' : 'text-gray-600 hover:text-gray-900'}`}
                        title={isListening ? 'Stop recording' : 'Start voice input'}
                      >
                        {isListening ? (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="4" width="6" height="11" rx="3"></rect><line x1="12" y1="19" x2="12" y2="22"></line><line x1="8" y1="22" x2="16" y2="22"></line></svg>
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="11" rx="3"></rect><line x1="12" y1="13" x2="12" y2="19"></line><path d="M5 10v2a7 7 0 0 0 14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line><line x1="8" y1="22" x2="16" y2="22"></line></svg>
                        )}
                      </button>

                      {/* Submit Button */}
                      <button
                        onClick={handleSubmit}
                        disabled={!answer.trim() || isLoading || isSubmitted}
                        className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Submit answer"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                      </button>
                    </div>

                    {/* Recording indicator */}
                    {isListening && (
                      <div className="absolute -top-8 left-0 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        Recording...
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center mt-6">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">{answer.length}</span> characters
                        <span className="ml-4 text-gray-400">Recommended: 200-500 words</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      {!isSubmitted ? (
                        <button
                          onClick={handleSubmit}
                          disabled={!answer.trim() || isLoading}
                          className="flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition-colors font-semibold text-white text-lg shadow-lg"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                              Analyzing...
                            </>
                          ) : (
                            <>Submit Answer</>
                          )}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
                
                {/* Navigation - Always visible */}
                <div className="flex justify-between items-center">
                  
                  <button
                    onClick={() => {
                      const prevQuestion = getPreviousQuestion();
                      if (prevQuestion) {
                        // Reset state for previous question
                        setAnswer('');
                        setFeedback(null);
                        setAnalysisResult(null);
                        setIsSubmitted(false);
                        setIsLoading(false);
                        
                        // Tạo ID deterministic dựa trên index thay vì Math.random()
                        const prevIndex = currentQuestionIndex - 1;
                        const newQuestionId = `q${prevIndex}-prev`;
                        
                        // Set navigation flag
                        setIsNavigating(true);
                        
                        // Update the question state and index
                        setCurrentQuestionIndex(prevIndex);
                        setInterviewQuestion({
                          id: newQuestionId,
                          title: prevQuestion.title,
                          type: prevQuestion.type,
                          description: prevQuestion.description,
                          tips: prevQuestion.tips
                        });
                        
                        // Update the URL with preserved questionSetId and question params
                        const questionSetId = searchParams.get('questionSetId');
                        const returnUrl = searchParams.get('returnUrl');
                        const context = searchParams.get('context');
                        
                        let newUrl = `/jd-interview/${newQuestionId}?question=${encodeURIComponent(prevQuestion.title)}&type=JD-Generated&questionIndex=${prevIndex}`;
                        if (context) newUrl += `&context=${context}`;
                        if (questionSetId) newUrl += `&questionSetId=${questionSetId}`;
                        if (returnUrl) newUrl += `&returnUrl=${encodeURIComponent(returnUrl)}`;
                        
                        window.history.replaceState(null, '', newUrl);
                        
                        // Reset navigation flag after a delay
                        setTimeout(() => setIsNavigating(false), 100);
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={availableQuestions.length === 0 || currentQuestionIndex <= 0 || !getPreviousQuestion()}
                  >
                    <span>←</span>
                    Previous Question (Question {currentQuestionIndex + 1} → {currentQuestionIndex})
                  </button>
                  
                  <button
                    onClick={() => {
                      // Reset state for next question
                      setAnswer('');
                      setFeedback(null);
                      setAnalysisResult(null);
                      setIsSubmitted(false);
                      setIsLoading(false);
                      setAnswerStartTime(null); // Reset timing
                      
                      // Get the next question in order
                      const nextQuestion = getNextQuestion();
                      
                      if (nextQuestion) {
                        // Update current question index first
                        const nextIndex = currentQuestionIndex + 1;
                        // Tạo ID deterministic dựa trên index thay vì Math.random()
                        const newQuestionId = `q${nextIndex}-next`;
                        
                        // Set navigation flag
                        setIsNavigating(true);
                        
                        setCurrentQuestionIndex(nextIndex);
                        
                        // Update the question state without navigation
                        setInterviewQuestion({
                          id: newQuestionId,
                          title: nextQuestion.title,
                          type: nextQuestion.type,
                          description: nextQuestion.description,
                          tips: nextQuestion.tips
                        });
                        
                        // Update the URL without navigation to reflect new question ID with preserved questionSetId and question params
                        const questionSetId = searchParams.get('questionSetId');
                        const returnUrl = searchParams.get('returnUrl');
                        const context = searchParams.get('context');
                        
                        let newUrl = `/jd-interview/${newQuestionId}?question=${encodeURIComponent(nextQuestion.title)}&type=JD-Generated&questionIndex=${nextIndex}`;
                        if (context) newUrl += `&context=${context}`;
                        if (questionSetId) newUrl += `&questionSetId=${questionSetId}`;
                        if (returnUrl) newUrl += `&returnUrl=${encodeURIComponent(returnUrl)}`;
                        
                        window.history.replaceState(null, '', newUrl);
                        
                        // Reset navigation flag after a delay
                        setTimeout(() => setIsNavigating(false), 100);
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={availableQuestions.length === 0 || !getNextQuestion()}
                  >
                    <span>
                      {availableQuestions.length === 0 
                        ? "No Questions Available" 
                        : !getNextQuestion()
                        ? "Last Question in Set"
                        : "Skip to Next"
                      }
                    </span>
                    {availableQuestions.length > 0 && getNextQuestion() && (
                      <span className="text-lg">→</span>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Right Column - AI Feedback */}
              <div className="lg:col-span-2 space-y-6">
                {/* AI Feedback Box */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden sticky top-8">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl">🤖</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-xl">AI Feedback</h3>
                        <p className="text-sm text-gray-500">Powered by advanced AI analysis</p>
                      </div>
                      {isSubmitted && (
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white text-lg font-bold">✓</span>
                        </div>
                      )}
                    </div>
                    
                    {!feedback && !isLoading && (
                      <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-dashed border-blue-200 rounded-xl p-8 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-blue-600 text-2xl">📝</span>
                        </div>
                        <p className="text-lg text-gray-600 font-medium mb-2">Ready for Analysis</p>
                        <p className="text-sm text-gray-500">Submit your answer to receive detailed AI feedback and personalized suggestions for improvement.</p>
                      </div>
                    )}
                    
                    {isLoading && (
                      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-8">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <div className="animate-spin w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full"></div>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-orange-700 text-lg mb-2">AI is analyzing...</p>
                          <p className="text-sm text-orange-600">Please wait while our AI reviews your answer and prepares personalized feedback.</p>
                        </div>
                      </div>
                    )}
                    
                    {feedback && analysisResult && analysisResult.detailedScores && (
                      <div className="space-y-6">
                        <h4 className="font-bold text-gray-900 text-lg mb-2">Score Breakdown</h4>
                        <div className="space-y-4">
                          {Object.entries(analysisResult.detailedScores).map(([key, value]) => (
                            <div key={key} className="flex flex-col gap-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-700 font-medium">{key}</span>
                                <span className="text-gray-500 text-sm">{value}/10</span>
                              </div>
                              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-4 rounded-full transition-all duration-700 ${value >= 8 ? 'bg-green-500' : value >= 5 ? 'bg-orange-400' : 'bg-red-400'}`}
                                  style={{ width: `${(value / 10) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 text-sm text-gray-600 text-center">
                          Higher scores mean you are closer to the next level for each skill.
                        </div>
                      </div>
                    )}
                    
                    {feedback && (
                      <div className="space-y-6">
                        {/* Detailed Feedback */}
                        <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl overflow-hidden shadow-lg">
                          <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4">
                            <div className="flex items-center gap-2 text-white">
                              <span className="text-xl">✨</span>
                              <span className="font-semibold text-lg">Detailed Analysis</span>
                            </div>
                          </div>
                          <div className="p-6">
                            {/* Strengths & Improvements Cards */}
                            {analysisResult && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {/* Strengths */}
                                {analysisResult.strengths && analysisResult.strengths.length > 0 && (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                                      <span>✅</span> Strengths
                                    </h4>
                                    <ul className="space-y-2">
                                      {analysisResult.strengths.map((strength, index) => (
                                        <li key={index} className="text-green-700 text-sm">• {strength}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {/* Improvements */}
                                {analysisResult.improvements && analysisResult.improvements.length > 0 && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                      <span>💡</span> Areas for Improvement
                                    </h4>
                                    <ul className="space-y-2">
                                      {analysisResult.improvements.map((improvement, index) => (
                                        <li key={index} className="text-blue-700 text-sm">• {improvement}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Full Feedback */}
                            <div className="prose prose-base max-w-none">
                              <div 
                                className="text-gray-700 leading-relaxed space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar"
                                dangerouslySetInnerHTML={{
                                  __html: feedback
                                    .split('\n')
                                    .map((line, index) => {
                                      // Highlight strengths
                                      if (line.toLowerCase().includes('strength') || line.toLowerCase().includes('good') || line.toLowerCase().includes('well') || line.toLowerCase().includes('excellent') || line.toLowerCase().includes('strong')) {
                                        return `<div class="bg-green-100 border-l-4 border-green-500 p-4 rounded-r-lg mb-3 feedback-highlight" style="animation-delay: ${index * 0.1}s">
                                          <span class="text-green-800 font-medium text-base">✅ ${line}</span>
                                        </div>`;
                                      }
                                      // Highlight improvements
                                      if (line.toLowerCase().includes('improve') || line.toLowerCase().includes('consider') || line.toLowerCase().includes('suggestion') || line.toLowerCase().includes('recommend') || line.toLowerCase().includes('could') || line.toLowerCase().includes('should')) {
                                        return `<div class="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-r-lg mb-3 feedback-highlight" style="animation-delay: ${index * 0.1}s">
                                          <span class="text-blue-800 font-medium text-base">💡 ${line}</span>
                                        </div>`;
                                      }
                                      // Highlight issues/concerns
                                      if (line.toLowerCase().includes('concern') || line.toLowerCase().includes('issue') || line.toLowerCase().includes('missing') || line.toLowerCase().includes('lack') || line.toLowerCase().includes('weak') || line.toLowerCase().includes('unclear')) {
                                        return `<div class="bg-orange-100 border-l-4 border-orange-500 p-4 rounded-r-lg mb-3 feedback-highlight" style="animation-delay: ${index * 0.1}s">
                                          <span class="text-orange-800 font-medium text-base">⚠️ ${line}</span>
                                        </div>`;
                                      }
                                      // Highlight scores or ratings
                                      if (line.toLowerCase().includes('score') || line.toLowerCase().includes('rating') || line.toLowerCase().includes('/10') || line.toLowerCase().includes('points')) {
                                        return `<div class="bg-purple-100 border-l-4 border-purple-500 p-4 rounded-r-lg mb-3 feedback-highlight" style="animation-delay: ${index * 0.1}s">
                                          <span class="text-purple-800 font-medium text-base">📊 ${line}</span>
                                        </div>`;
                                      }
                                      // Default styling for regular text
                                      return line.trim() ? `<p class="text-gray-700 mb-3 feedback-highlight text-base leading-relaxed" style="animation-delay: ${index * 0.1}s">${line}</p>` : '';
                                    })
                                    .join('')
                                }}
                              />
                            </div>
                            
                            {/* Action buttons */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                              <div className="flex gap-3">
                                <button 
                                  onClick={() => navigator.clipboard.writeText(feedback)}
                                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-xl transition-colors flex-1 justify-center"
                                >
                                  <span>📋</span>
                                  Copy Feedback
                                </button>
                                <button 
                                  onClick={() => {
                                    setFeedback(null);
                                    setAnalysisResult(null);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex-1 justify-center"
                                >
                                  <span>🔄</span>
                                  Clear
                                </button>
                              </div>
                              
                              {/* Next Question Button */}
                              <div className="mt-4">
                                <button
                                  onClick={() => {
                                    // Reset state for next question
                                    setAnswer('');
                                    setFeedback(null);
                                    setAnalysisResult(null);
                                    setIsSubmitted(false);
                                    setIsLoading(false);
                                    
                                    // Get the next question in order
                                    const nextQuestion = getNextQuestion();
                                    
                                    if (nextQuestion) {
                                      // Update current question index first
                                      const nextIndex = currentQuestionIndex + 1;
                                      // Tạo ID deterministic dựa trên index thay vì Math.random()
                                      const newQuestionId = `q${nextIndex}-feedback`;
                                      setCurrentQuestionIndex(nextIndex);
                                      
                                      // Update the question state without navigation
                                      setInterviewQuestion({
                                        id: newQuestionId,
                                        title: nextQuestion.title,
                                        type: nextQuestion.type,
                                        description: nextQuestion.description,
                                        tips: nextQuestion.tips
                                      });
                                      
                                      // Update the URL without navigation to reflect new question ID with preserved questionSetId and question params
                                      const questionSetId = searchParams.get('questionSetId');
                                      const returnUrl = searchParams.get('returnUrl');
                                      const context = searchParams.get('context');
                                      
                                      let newUrl = `/jd-interview/${newQuestionId}?question=${encodeURIComponent(nextQuestion.title)}&type=JD-Generated&questionIndex=${nextIndex}`;
                                      if (context) newUrl += `&context=${context}`;
                                      if (questionSetId) newUrl += `&questionSetId=${questionSetId}`;
                                      if (returnUrl) newUrl += `&returnUrl=${encodeURIComponent(returnUrl)}`;
                                      
                                      window.history.replaceState(null, '', newUrl);
                                    }
                                  }}
                                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                  disabled={availableQuestions.length === 0 || !getNextQuestion()}
                                >
                                  <span>
                                    {availableQuestions.length === 0 
                                      ? "No Questions Available" 
                                      : !getNextQuestion()
                                      ? "Last Question in Set Completed"
                                      : "Next Question"
                                    }
                                  </span>
                                  {availableQuestions.length > 0 && getNextQuestion() && (
                                    <span className="text-lg">→</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                  <h3 className="font-bold mb-4 text-gray-900 text-lg">Today&apos;s Progress</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 text-center">
                      <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">📝</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">Questions Answered</div>
                      <div className="font-bold text-gray-900 text-xl">{questionsAnswered}</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 text-center">
                      <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">📋</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">Question Progress</div>
                      <div className="font-bold text-gray-900 text-xl">
                        {availableQuestions.length > 0 
                          ? `${currentQuestionIndex + 1}/${availableQuestions.length}`
                          : "0/0"
                        }
                      </div>
                    </div>
                  </div>
                  
                  {questionSets.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 text-center">
                        From {questionSets.length} saved question sets
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
