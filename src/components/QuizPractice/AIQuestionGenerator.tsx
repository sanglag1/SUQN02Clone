"use client"

import type React from "react"
import { useMemo, useState, useRef, useEffect } from "react"
import {
  Bot,
  Settings,
  Eye,
  Save,
  X,
  Plus,
  Trash2,
  Copy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Wand2,
  Target,
  BookOpen,
  Hash,
  Lightbulb,
  ChevronDown,
  AlertCircle,
} from "lucide-react"

// Custom ComboBox Component with enhanced styling
interface ComboBoxProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
  description: string
  id: string
}

export function ComboBox({ label, value, onChange, options, placeholder, description, id }: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState(options)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setFilteredOptions(options)
  }, [options])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    onChange(inputValue)

    const filtered = options.filter((option) => option.toLowerCase().includes(inputValue.toLowerCase()))
    setFilteredOptions(filtered)
    setIsOpen(true)
  }

  const handleOptionClick = (option: string) => {
    onChange(option)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleInputFocus = () => {
    setFilteredOptions(options)
    setIsOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const index = text.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return text

    return (
      <>
        {text.slice(0, index)}
        <span className="bg-blue-100 text-blue-800 font-medium">{text.slice(index, index + query.length)}</span>
        {text.slice(index + query.length)}
      </>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium mb-2 text-gray-700">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleOptionClick(option)}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 hover:text-blue-700 first:rounded-t-xl last:rounded-b-xl text-sm transition-all"
            >
              {highlightMatch(option, value)}
            </button>
          ))}
        </div>
      )}

      <p className="mt-2 text-xs text-gray-500">{description}</p>
    </div>
  )
}

type AnswerItem = { content: string; isCorrect?: boolean }
interface GeneratedEditable {
  question: string
  answers: AnswerItem[]
  fields: string[]
  topics: string[]
  levels: string[]
  explanation?: string
}

interface ApiGeneratedItem {
  question: string
  answers?: AnswerItem[]
  fields?: string[]
  topics?: string[]
  levels?: string[]
  explanation?: string
}

interface DuplicateCheckResult {
  questionIndex: number
  isDuplicate: boolean
  similarQuestions: {
    id: string
    question: string
    similarity: number
  }[]
}

interface Props {
  open: boolean
  onClose: () => void
  fields: string[]
  topics: string[]
  onGenerated: () => void
  topicsByField?: Record<string, string[]>
  levelsOptions?: string[]
}

export default function AIQuestionGenerator({
  open,
  onClose,
  fields,
  topics,
  onGenerated,
  topicsByField = {},
  levelsOptions = ["Junior", "Middle", "Senior"],
}: Props) {
  const [field, setField] = useState("")
  const [topic, setTopic] = useState("")
  const [level, setLevel] = useState(levelsOptions[0] || "Junior")
  const [count, setCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [generated, setGenerated] = useState<GeneratedEditable[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [duplicateResults, setDuplicateResults] = useState<DuplicateCheckResult[] | null>(null)
  const [checkingDuplicates, setCheckingDuplicates] = useState(false)

  const letters = ["A", "B", "C", "D", "E", "F", "G"]

  // Level configuration matching the question form
  const levelConfig = {
    junior: { label: "Junior", color: "green", icon: "🌱" },
    middle: { label: "Middle", color: "yellow", icon: "🔥" },
    senior: { label: "Senior", color: "red", icon: "💎" },
  }

  const filteredTopics = useMemo(() => {
    if (!field) return topics
    const list = topicsByField[field]
    return list && list.length > 0 ? list : topics
  }, [field, topicsByField, topics])

  const handleFieldChange = (newField: string) => {
    setField(newField)
    if (field && newField !== field && topicsByField[newField] && !topicsByField[newField].includes(topic)) {
      setTopic("")
    }
  }

  const canRequest = field.trim() && topic.trim() && level && count > 0 && count <= 50

  const handleGenerate = async () => {
    if (!canRequest) return
    setLoading(true)
    setError(null)
    setGenerated(null)
    try {
      const res = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, topic, level: level.toLowerCase(), count }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || "Failed to generate")
        return
      }
      const list: ApiGeneratedItem[] = (data?.data as ApiGeneratedItem[]) ?? []
      const items: GeneratedEditable[] = list.map((q) => ({
        question: q.question,
        answers: Array.isArray(q.answers) ? q.answers : [],
        fields: q.fields && q.fields.length ? q.fields : [field],
        topics: q.topics && q.topics.length ? q.topics : [topic],
        levels: q.levels && q.levels.length ? q.levels : [level.toLowerCase()],
        explanation: q.explanation || "",
      }))
      setGenerated(items)

      await checkForDuplicates(items.map((q) => q.question))
    } catch {
      setError("Failed to generate")
    } finally {
      setLoading(false)
    }
  }

  const checkForDuplicates = async (questions: string[]) => {
    if (!questions.length) return

    setCheckingDuplicates(true)
    try {
      const res = await fetch("/api/questions/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      })

      if (res.ok) {
        const data = await res.json()
        setDuplicateResults(data.results || [])
      }
    } catch (error) {
      console.error("Failed to check duplicates:", error)
    } finally {
      setCheckingDuplicates(false)
    }
  }

  const updateAnswer = (qi: number, ai: number, patch: Partial<AnswerItem>) => {
    if (!generated) return
    setGenerated((prev) => {
      if (!prev) return prev
      const clone = [...prev]
      const q = { ...clone[qi] }
      const ans = q.answers.map((a, i) => (i === ai ? { ...a, ...patch } : a))
      clone[qi] = { ...q, answers: ans }
      return clone
    })
  }

  const addAnswer = (qi: number) => {
    if (!generated) return
    setGenerated((prev) => {
      if (!prev) return prev
      const clone = [...prev]
      const q = { ...clone[qi] }
      clone[qi] = { ...q, answers: [...q.answers, { content: "", isCorrect: false }] }
      return clone
    })
  }

  const removeAnswer = (qi: number, ai: number) => {
    if (!generated) return
    setGenerated((prev) => {
      if (!prev) return prev
      const clone = [...prev]
      const q = { ...clone[qi] }
      clone[qi] = { ...q, answers: q.answers.filter((_, i) => i !== ai) }
      return clone
    })
  }

  const updateQuestion = (qi: number, patch: Partial<GeneratedEditable>) => {
    if (!generated) return
    setGenerated((prev) => {
      if (!prev) return prev
      const clone = [...prev]
      clone[qi] = { ...clone[qi], ...patch }
      return clone
    })

    if (patch.question !== undefined) {
      setDuplicateResults((prev) => {
        if (!prev) return prev
        return prev.map((result) =>
          result.questionIndex === qi ? { ...result, isDuplicate: false, similarQuestions: [] } : result,
        )
      })
    }
  }

  const duplicateQuestion = (qi: number) => {
    if (!generated) return
    setGenerated((prev) => {
      if (!prev) return prev
      const clone = [...prev]
      clone.splice(qi + 1, 0, JSON.parse(JSON.stringify(clone[qi])) as GeneratedEditable)
      return clone
    })
  }

  const removeQuestion = (qi: number) => {
    if (!generated) return
    setGenerated((prev) => {
      if (!prev) return prev
      return prev.filter((_, i) => i !== qi)
    })
  }

  const validToSave = (generated ?? []).every(
    (q) => q.question.trim() && q.answers.some((a) => a.isCorrect) && q.answers.every((a) => a.content.trim()),
  )

  const handleSaveAll = async () => {
    if (!generated || generated.length === 0) return
    if (!validToSave) {
      setError("Each question needs text, non-empty answers and at least one correct answer.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      for (const q of generated) {
        const questionData = {
          ...q,
          levels: q.levels.map((level) => level.toLowerCase()),
        }
        await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(questionData),
        })
      }
      onGenerated()
      handleClose()
    } catch {
      setError("Failed to save questions")
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setGenerated(null)
    setDuplicateResults(null)
    setError(null)
    setField("")
    setTopic("")
    setLevel(levelsOptions[0] || "Junior")
    setCount(5)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">AI Question Generator</h3>
              <p className="text-sm text-gray-600">Generate intelligent quiz questions with AI assistance</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {!generated ? (
            // Configuration Phase
            <div className="space-y-6">
              {/* Configuration Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <h4 className="text-lg font-semibold text-gray-800">Generation Settings</h4>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
                  {/* Field and Topic */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <ComboBox
                        id="field-input"
                        label="Field"
                        value={field}
                        onChange={handleFieldChange}
                        options={fields}
                        placeholder="Select or type a field..."
                        description="Choose the subject area for question generation"
                      />
                      {field && !fields.includes(field) && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            ✨ New Field
                          </span>
                          <span className="text-xs text-gray-600">This field will be created</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <ComboBox
                        id="topic-input"
                        label="Topic"
                        value={topic}
                        onChange={setTopic}
                        options={filteredTopics}
                        placeholder="Select or type a topic..."
                        description="Specific topic within the selected field"
                      />
                      {topic && !filteredTopics.includes(topic) && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            ✨ New Topic
                          </span>
                          <span className="text-xs text-gray-600">This topic will be created</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Level and Count */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-3 text-gray-700">Level</label>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(levelConfig).map(([key, config]) => {
                          const active = level.toLowerCase() === key
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setLevel(config.label)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                                active
                                  ? `bg-${config.color}-500 text-white border-${config.color}-500 shadow-lg scale-105`
                                  : `bg-white text-gray-700 border-gray-200 hover:border-${config.color}-300 hover:bg-${config.color}-50`
                              }`}
                            >
                              <span className="text-base">{config.icon}</span>
                              {config.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3 text-gray-700">
                        Question Count: <span className="font-bold text-blue-600">{count}</span>
                      </label>
                      <div className="space-y-3">
                        <input
                          type="range"
                          min={1}
                          max={50}
                          value={count}
                          onChange={(e) => setCount(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(count / 50) * 100}%, #E5E7EB ${(count / 50) * 100}%, #E5E7EB 100%)`,
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>1 question</span>
                          <span>50 questions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}
            </div>
          ) : (
            // Review Phase
            <div className="space-y-6">
              {/* Review Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-5 h-5 text-purple-600" />
                  <h4 className="text-lg font-semibold text-gray-800">Review Generated Questions</h4>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                          {generated.length} questions generated
                        </span>
                        {duplicateResults && duplicateResults.some((r) => r.isDuplicate) && (
                          <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {duplicateResults.filter((r) => r.isDuplicate).length} potential duplicates
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => checkForDuplicates(generated.map((q) => q.question))}
                        disabled={checkingDuplicates}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm transition-all"
                      >
                        <RefreshCw className={`w-4 h-4 ${checkingDuplicates ? "animate-spin" : ""}`} />
                        {checkingDuplicates ? "Checking..." : "Re-check"}
                      </button>
                      <button
                        onClick={() => setGenerated(null)}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-all"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-4">
                {generated.map((q, qi) => {
                  const hasCorrect = q.answers.some((a) => a.isCorrect)
                  const duplicateInfo = duplicateResults?.find((r) => r.questionIndex === qi)
                  const isDuplicate = duplicateInfo?.isDuplicate || false

                  return (
                    <div
                      key={qi}
                      className={`rounded-xl border-2 p-4 transition-all ${
                        hasCorrect
                          ? isDuplicate
                            ? "border-orange-300 bg-orange-50"
                            : "border-gray-200 bg-white"
                          : "border-red-300 bg-red-50"
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {qi + 1}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {!hasCorrect && (
                              <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                                <XCircle className="w-3 h-3" />
                                Needs correct answer
                              </span>
                            )}
                            {isDuplicate && (
                              <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                                <AlertTriangle className="w-3 h-3" />
                                Similar question found
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => duplicateQuestion(qi)}
                            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-all"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={() => removeQuestion(qi)}
                            className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Question Content */}
                      <div className="space-y-4">
                        {/* Question Text */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <label className="block text-sm font-medium text-gray-700">Question</label>
                          </div>
                          <textarea
                            className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                            rows={3}
                            value={q.question}
                            onChange={(e) => updateQuestion(qi, { question: e.target.value })}
                            placeholder="Enter your question here..."
                          />
                        </div>

                        {/* Duplicate Warning */}
                        {isDuplicate && duplicateInfo && duplicateInfo.similarQuestions.length > 0 && (
                          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="w-5 h-5 text-orange-600" />
                              <span className="text-orange-800 font-medium text-sm">Similar questions detected:</span>
                            </div>
                            <div className="space-y-2">
                              {duplicateInfo.similarQuestions.slice(0, 3).map((similar, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-lg border border-orange-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-orange-600 font-medium">
                                      Similarity: {Math.round(similar.similarity * 100)}%
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-800 line-clamp-2">{similar.question}</p>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-orange-600 mt-3">
                              💡 Consider modifying this question to make it more unique or remove it if its too
                              similar.
                            </p>
                          </div>
                        )}

                        {/* Answers Section */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-purple-600" />
                              <label className="block text-sm font-medium text-gray-700">Answer Options</label>
                            </div>
                            <button
                              type="button"
                              onClick={() => addAnswer(qi)}
                              className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all"
                            >
                              <Plus className="w-4 h-4" />
                              Add Answer
                            </button>
                          </div>
                          <div className="space-y-3">
                            {q.answers.map((a, ai) => (
                              <div
                                key={ai}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                  a.isCorrect
                                    ? "border-green-300 bg-green-50"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                              >
                                <div
                                  className={`shrink-0 w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center border-2 transition-all ${
                                    a.isCorrect
                                      ? "bg-green-500 text-white border-green-500"
                                      : "bg-gray-100 text-gray-700 border-gray-300"
                                  }`}
                                >
                                  {letters[ai] || ai + 1}
                                </div>
                                <input
                                  className="flex-1 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                  value={a.content}
                                  onChange={(e) => updateAnswer(qi, ai, { content: e.target.value })}
                                  placeholder={`Enter answer option ${letters[ai] || ai + 1}...`}
                                />
                                <button
                                  type="button"
                                  onClick={() => updateAnswer(qi, ai, { isCorrect: !a.isCorrect })}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${
                                    a.isCorrect
                                      ? "bg-green-500 text-white hover:bg-green-600"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  }`}
                                >
                                  {a.isCorrect ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4" />
                                      Correct
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-4 h-4" />
                                      Mark Correct
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeAnswer(qi, ai)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Details Section */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Hash className="w-4 h-4 text-orange-600" />
                            <label className="block text-sm font-medium text-gray-700">Question Details</label>
                          </div>
                          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Fields</label>
                                <input
                                  className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                                  value={q.fields.join(", ")}
                                  onChange={(e) =>
                                    updateQuestion(qi, {
                                      fields: e.target.value
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean),
                                    })
                                  }
                                  placeholder="Enter fields..."
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Topics</label>
                                <input
                                  className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                                  value={q.topics.join(", ")}
                                  onChange={(e) =>
                                    updateQuestion(qi, {
                                      topics: e.target.value
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean),
                                    })
                                  }
                                  placeholder="Enter topics..."
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Levels</label>
                                <input
                                  className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                                  value={q.levels.join(", ")}
                                  onChange={(e) =>
                                    updateQuestion(qi, {
                                      levels: e.target.value
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean),
                                    })
                                  }
                                  placeholder="Enter levels..."
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Explanation Section */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-yellow-600" />
                            <label className="block text-sm font-medium text-gray-700">Explanation</label>
                          </div>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <textarea
                              className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                              rows={3}
                              value={q.explanation || ""}
                              onChange={(e) => updateQuestion(qi, { explanation: e.target.value })}
                              placeholder="💡 Provide a detailed explanation for the correct answer..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {!generated ? (
              canRequest ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Ready to generate
                </div>
              ) : (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  Complete all required fields
                </div>
              )
            ) : validToSave ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                Ready to save
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="w-4 h-4" />
                Fix validation errors before saving
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            {!generated ? (
              <button
                disabled={!canRequest || loading}
                onClick={handleGenerate}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                  canRequest && !loading
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Questions
                  </>
                )}
              </button>
            ) : (
              <button
                disabled={!validToSave || saving}
                onClick={handleSaveAll}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                  validToSave && !saving
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save All Questions
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
