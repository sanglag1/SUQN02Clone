"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronLeft, Target, BarChart3 } from 'lucide-react';
import type { Quiz } from './QuizPanel';

interface ConfigType {
  field: string;
  topic: string;
  level: string;
  questionCount: string;
  timeLimit: string;
  error?: string;
}

interface QuizStartProps {
  config: ConfigType
  onChange: (config: ConfigType) => void
  onStart: (quizData: Quiz) => void
  isLoading: boolean
  error: string | null
}

const experienceLevels = [
  { value: "junior", label: "Junior", description: "0-2 years experience" },
  { value: "middle", label: "Middle", description: "2-5 years experience" },
  { value: "senior", label: "Senior", description: "5+ years experience" },
];

export default function QuizStart({ config, onChange, onStart, isLoading, error }: QuizStartProps) {
  const [step, setStep] = useState<"field" | "topic" | "config">("field")
  const [selectedField, setSelectedField] = useState<string>("")
  const [selectedTopic, setSelectedTopic] = useState<string>("")
  const [questionCount, setQuestionCount] = useState("") // ban đầu rỗng
  const [timeLimit, setTimeLimit] = useState("") // ban đầu rỗng
  const [level, setLevel] = useState(""); // ban đầu rỗng
  const [isGenerating, setIsGenerating] = useState(false);
  const [levelUnlock, setLevelUnlock] = useState<{ junior: boolean; middle: boolean; senior: boolean }>({ junior: true, middle: false, senior: false });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [jobRoles, setJobRoles] = useState<Array<{ title: string; category?: { name?: string; skills?: string[] } | null }>>([]);
  
  // New state for dynamic data
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);

  // Lọc topic theo field đã chọn
  const filteredTopics = availableTopics;

  const quizSettings = [
    { questions: 5, timeLimit: 5, label: "5 questions - 5 minutes",  type: "Quick", color: "from-green-400 to-emerald-400" },
    { questions: 10, timeLimit: 10, label: "10 questions - 10 minutes",  type: "Standard", color: "from-blue-400 to-cyan-400" },
    { questions: 15, timeLimit: 15, label: "15 questions - 15 minutes",  type: "Extended", color: "from-purple-400 to-pink-400" },
    { questions: 20, timeLimit: 20, label: "20 questions - 20 minutes",  type: "Comprehensive", color: "from-orange-400 to-red-400" },
  ]

  const handleFieldSelect = (field: string) => {
    setSelectedField(field)
    onChange({ ...config, field: field, error: undefined })
    setStep("topic")
  }

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic)
    onChange({ ...config, topic: topic, error: undefined })
    setStep("config")
  }

  // Removed old metadata endpoints; now using /api/positions

  const validateCustomInputs = () => {
    return true; // No custom inputs anymore
  };

  const handleStartQuiz = async () => {
    if (!validateCustomInputs()) return;
    setIsGenerating(true);

    try {
      // Gọi API secure quiz từ DB (tạo quiz mới)
      const quizRes = await fetch('/api/quizzes/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: selectedField,
          topic: selectedTopic,
          level: level || "junior",
          count: Number(questionCount),
          timeLimit: Number(timeLimit),
        }),
      });
      // Handle non-OK status codes with proper error message
      if (!quizRes.ok) {
        let serverError = 'Failed to start quiz';
        try {
          const errJson = await quizRes.json();
          serverError = errJson?.error || serverError;
        } catch {}
        onChange({ ...config, error: serverError });
        setIsGenerating(false);
        return;
      }
      const quizData = await quizRes.json();
      if (quizData?.error) {
        onChange({ ...config, error: quizData.error });
        setIsGenerating(false);
        return;
      }
      onStart(quizData);
    } catch {
      onChange({ ...config, error: 'Something went wrong!' });
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid = selectedField && selectedTopic && level && questionCount && timeLimit

  const renderFieldSelection = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Select Specialization</h3>
        <p className="text-gray-600 text-sm">Which specialization do you want to practice?</p>
      </div>

      {fieldsLoading ? (
        <div className="text-center py-8">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-2">Loading fields...</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {availableFields.map((field: string) => (
            <div
              key={field}
              onClick={() => handleFieldSelect(field)}
              className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                selectedField === field
                  ? `bg-gradient-to-r from-blue-50 to-cyan-50 border-purple-500 shadow-lg`
                  : "bg-white/70 border-gray-200 hover:border-purple-300 hover:shadow-md"
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">📚</div>
                <h4 className="font-bold text-gray-800 text-sm">{field}</h4>
              </div>
              {selectedField === field && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderTopicSelection = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Select Topic</h3>
        <p className="text-gray-600 text-sm">Choose the topic you want to practice.</p>
      </div>

      {topicsLoading ? (
        <div className="text-center py-8">
          <div className="inline-block w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-2">Loading topics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filteredTopics.map((topic: string) => (
            <div
              key={topic}
              onClick={() => handleTopicSelect(topic)}
              className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                selectedTopic === topic
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-500 shadow-lg"
                  : "bg-white/70 border-gray-200 hover:border-green-300 hover:shadow-md"
              }`}
            >
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="text-2xl">🏷️</div>
                </div>
                <h4 className="font-semibold text-gray-800 text-xs leading-tight">{topic}</h4>
              </div>
              {selectedTopic === topic && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-center pt-4">
        <Button variant="outline" onClick={() => setStep("field")} className="flex items-center gap-2 text-sm">
          <ChevronLeft className="w-4 h-4" />
          Back to specialization selection
        </Button>
      </div>
    </div>
  )

  const renderConfiguration = () => {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Quiz Configuration</h3>
          <p className="text-gray-600">Customize the number of questions and time</p>
        </div>
        <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200">
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Specialization:</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {selectedField || config.field}
              </span>
            </div>
          </div>
          <div className="w-px h-12 bg-gray-300"></div>
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Topic:</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {selectedTopic || config.topic}
              </span>
            </div>
          </div>
        </div>

        {/* Level selection */}
          <div className="space-y-8">
            {/* Level selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-700">Level</span>
              {historyLoading && <span className="ml-2 text-xs text-gray-500 animate-pulse">Checking unlocks...</span>}
              </div>
              

              
              <div className="flex flex-row gap-4 justify-center w-full">
              {experienceLevels.map((lvl: typeof experienceLevels[number]) => {
                let disabled = false;
                let tooltip = "";
                if (lvl.value === "middle" && !levelUnlock.middle) {
                  disabled = true;
                  tooltip = "Unlock by scoring ≥ 90 in Junior quizzes for this topic.";
                }
                if (lvl.value === "senior" && !levelUnlock.senior) {
                  disabled = true;
                  tooltip = "Unlock by scoring ≥ 90 in Middle quizzes for this topic.";
                }
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => { if (!disabled) { setLevel(lvl.value); onChange({ ...config, level: lvl.value }); } }}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 h-24 text-lg font-bold rounded-full transition border-2 mx-1 min-w-[120px] max-w-[200px] ${
                      level === lvl.value
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg border-purple-500"
                        : disabled
                        ? "bg-gray-100 text-gray-400 opacity-40 border-transparent cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 opacity-60 hover:opacity-100 border-transparent"
                    } focus:outline-none`}
                    style={{ minWidth: 0 }}
                    disabled={disabled}
                    title={tooltip}
                  >
                    <span className="text-2xl"></span>
                    <span>{lvl.label}</span>
                    <span className="text-xs font-normal">{lvl.description}</span>
                    {disabled && tooltip && (
                      <span className="text-xs text-red-500 mt-1">{tooltip}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Quiz Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-base font-semibold text-gray-700">Quiz Settings</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quizSettings.map((setting) => (
                <div
                  key={setting.questions}
                  onClick={() => {
                    setQuestionCount(setting.questions.toString())
                    setTimeLimit(setting.timeLimit.toString())
                  }}
                  className={`relative group p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                    questionCount === setting.questions.toString() && timeLimit === setting.timeLimit.toString()
                      ? `bg-gradient-to-r ${setting.color.replace("400", "500/10")} border-orange-500/50 shadow-lg`
                      : "bg-white/50 border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold text-gray-800 text-base mb-1">{setting.label}</div>
                    <div className="text-sm text-gray-500">{setting.type}</div>
                  </div>
                  {questionCount === setting.questions.toString() && timeLimit === setting.timeLimit.toString() && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => setStep("topic")} className="flex items-center gap-2 text-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to topic selection
          </Button>
        </div>
      </div>
    )
  }

  // Fetch quiz history and update level unlocks
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedField || !selectedTopic) return;
      setHistoryLoading(true);
      try {
        const res = await fetch("/api/quizzes/history");
        if (!res.ok) throw new Error("Failed to fetch quiz history");
        const data = await res.json();
        const quizzes = data.quizzes || [];
        
        // Filter quizzes by exact field and topic match
        const filteredQuizzes = quizzes.filter((q: { field: string; topic: string; level: string; score?: number }) => {
          return q.field === selectedField && q.topic === selectedTopic;
        });
        
        // Find best scores for each level
        let bestJunior = 0, bestMiddle = 0, bestSenior = 0;
        
        filteredQuizzes.forEach((q: { level: string; score?: number }) => {
          const score = q.score || 0;
          if (q.level === "junior") {
            bestJunior = Math.max(bestJunior, score);
          } else if (q.level === "middle") {
            bestMiddle = Math.max(bestMiddle, score);
          } else if (q.level === "senior") {
            bestSenior = Math.max(bestSenior, score);
          }
        });
        
        // Unlock logic based on best scores (hệ số 10)
        const unlock = {
          junior: true, // Always unlocked
          middle: bestJunior >= 9, // Unlock if best junior score >= 9
          senior: bestMiddle >= 9, // Unlock if best middle score >= 9
        };

        setLevelUnlock(unlock);

        // Debug logging
        console.log(`Field: ${selectedField}, Topic: ${selectedTopic}`);
        console.log(`Best scores - Junior: ${bestJunior}, Middle: ${bestMiddle}, Senior: ${bestSenior}`);
        console.log(`Unlocks - Junior: ${unlock.junior}, Middle: ${unlock.middle}, Senior: ${unlock.senior}`);
        
      } catch (e) {
        console.error('Error fetching quiz history:', e);
        // Default: only junior unlocked
        setLevelUnlock({ junior: true, middle: false, senior: false });
      } finally {
        setHistoryLoading(false);
      }
    };
    
    fetchHistory();
  }, [selectedField, selectedTopic]);

  // Fetch available fields (categories) from /api/positions on mount
  useEffect(() => {
    const fetchPositions = async () => {
      setFieldsLoading(true);
      try {
        const response = await fetch('/api/positions');
        if (!response.ok) throw new Error('Failed to fetch positions');
        const roles: Array<{ title: string; category?: { name?: string; skills?: string[] } | null }> = await response.json();
        setJobRoles(roles);

        // Derive unique category names as "fields"
        const specs = Array.from(
          new Set(
            roles
              .map(r => r.category?.name)
              .filter((n): n is string => Boolean(n))
          )
        );
        setAvailableFields(specs);
      } catch (e) {
        console.error('Error fetching positions:', e);
        setAvailableFields([]);
      } finally {
        setFieldsLoading(false);
      }
    };

    fetchPositions();
  }, []);

  // Derive topics (skills) by selected category locally (no extra API call)
  useEffect(() => {
    if (!selectedField) return;
    setTopicsLoading(true);
    try {
      const skillSet = new Set<string>();
      jobRoles
        .filter(r => (r.category?.name || '') === selectedField)
        .forEach(r => {
          (r.category?.skills || []).forEach(s => skillSet.add(s));
        });
      setAvailableTopics(Array.from(skillSet));
    } finally {
      setTopicsLoading(false);
    }
  }, [selectedField, jobRoles]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="relative container mx-auto px-4 py-6">
        {/* Main Content */}
        <div className="max-w-5xl mx-auto">
          <Card className="bg-white/90 backdrop-blur-sm border-white/60 shadow-xl">
            <CardContent className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>
              )}

              {step === "field" && renderFieldSelection()}
              {step === "topic" && renderTopicSelection()}
              {step === "config" && renderConfiguration()}

              {/* Start Button */}
              {isFormValid && step === "config" && (
                <div className="pt-6">
                  <div className="text-center">
                    <button
                      onClick={handleStartQuiz}
                      disabled={isLoading || isGenerating || Boolean(error)}
                      className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
                    >
                      {isLoading || isGenerating ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          <span>{isGenerating ? "Generating quiz..." : "Creating quiz with AI..."}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                          Start Quiz
                        </>
                      )}
                    </button>
                    {error && (
                      <p className="text-sm text-red-600 mt-3" role="alert" aria-live="assertive">
                        {error}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-3">
                      AI will generate personalized questions based on your selections
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
