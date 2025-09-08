"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { ComboBox } from "./AIQuestionGenerator"
import {
  Plus,
  Trash2,
  X,
  AlertCircle,
  BookOpen,
  Target,
  Lightbulb,
  Save,
  Edit3,
  Hash,
  CheckCircle2,
  XCircle,
} from "lucide-react"

export interface AnswerItem {
  content: string
  isCorrect?: boolean
}

export interface QuestionPayload {
  id?: string
  question: string
  answers: AnswerItem[]
  fields: string[]
  topics: string[]
  levels: string[]
  explanation?: string
}

interface QuestionFormProps {
  open: boolean
  onClose: () => void
  initial?: QuestionPayload | null
  onSubmit: (data: QuestionPayload) => Promise<void> | void
  fieldsOptions?: string[]
  topicsOptions?: string[]
  topicsByField?: Record<string, string[]>
  levelsOptions?: string[] // job role levels (e.g., Junior/Middle/Senior/Lead)
}

export default function QuestionForm({
  open,
  onClose,
  initial,
  onSubmit,
  fieldsOptions = [],
  topicsOptions = [],
  topicsByField = {},
}: QuestionFormProps) {
  const [field, setField] = useState<string>("")
  const [topic, setTopic] = useState<string>("")
  const [question, setQuestion] = useState("")
  const [answers, setAnswers] = useState<AnswerItem[]>([{ content: "", isCorrect: false }])
  const [levels, setLevels] = useState<string[]>([]) // quiz levels: junior/middle/senior
  const [explanation, setExplanation] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  // Removed unused currentStep state

  const letters = ["A", "B", "C", "D", "E", "F", "G"]

  // Map job role level label to quiz level value
  const levelConfig = {
    junior: { label: "Junior", color: "green", icon: "🌱" },
    middle: { label: "Middle", color: "yellow", icon: "🔥" },
    senior: { label: "Senior", color: "red", icon: "💎" },
  }

  useEffect(() => {
    if (initial) {
      setQuestion(initial.question || "")
      setAnswers(
        initial.answers && Array.isArray(initial.answers) ? initial.answers : [{ content: "", isCorrect: false }],
      )
      setField((initial.fields || [""])[0] || "")
      setTopic((initial.topics || [""])[0] || "")
      setLevels(initial.levels || [])
      setExplanation(initial.explanation || "")
    } else {
      setQuestion("")
      setAnswers([{ content: "", isCorrect: false }])
      setField("")
      setTopic("")
      setLevels([])
      setExplanation("")
    }
    // Removed setCurrentStep(1) since currentStep is unused
  }, [initial, open])

  const addAnswer = () => setAnswers((prev) => [...prev, { content: "", isCorrect: false }])
  const removeAnswer = (index: number) => setAnswers((prev) => prev.filter((_, i) => i !== index))
  const updateAnswer = (index: number, patch: Partial<AnswerItem>) =>
    setAnswers((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)))

  const toggleCorrect = (index: number) =>
    setAnswers((prev) => prev.map((a, i) => (i === index ? { ...a, isCorrect: !a.isCorrect } : a)))

  const validity = useMemo(() => {
    const trimmedAnswers = answers.filter((a) => a.content.trim())
    return {
      hasMinAnswers: trimmedAnswers.length >= 2,
      hasCorrect: trimmedAnswers.some((a) => a.isCorrect),
      hasQuestion: question.trim().length > 0,
      hasLevel: levels.length > 0,
      hasField: field.trim().length > 0,
      hasTopic: topic.trim().length > 0,
      hasExplanation: explanation.trim().length > 0,
    }
  }, [answers, question, levels, field, topic, explanation])

  const canSubmit =
    validity.hasQuestion &&
    validity.hasMinAnswers &&
    validity.hasCorrect &&
    validity.hasLevel &&
    validity.hasField &&
    validity.hasTopic &&
    validity.hasExplanation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const payload: QuestionPayload = {
        id: initial?.id,
        question,
        answers: answers.filter((a) => a.content.trim().length > 0),
        fields: field ? [field] : [],
        topics: topic ? [topic] : [],
        levels,
        explanation: explanation || undefined,
      }
      await onSubmit(payload)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const allowedTopics = useMemo(() => {
    if (!field) return topicsOptions
    const list = topicsByField[field]
    return list && list.length > 0 ? list : topicsOptions
  }, [field, topicsByField, topicsOptions])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              {initial ? <Edit3 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {initial ? "Edit Question" : "Create New Question"}
              </h3>
              <p className="text-sm text-gray-600">Build engaging quiz questions with detailed explanations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h4 className="text-lg font-semibold text-gray-800">Question Content</h4>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-blue-800">Question Text</label>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      question.length > 400
                        ? "bg-red-100 text-red-700"
                        : question.length > 300
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {question.length}/500
                  </span>
                </div>
                <textarea
                  maxLength={500}
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all ${
                    !validity.hasQuestion ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                  rows={3}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What would you like to ask? Be clear and specific..."
                />
                {!validity.hasQuestion && (
                  <div className="flex items-center gap-2 mt-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Question is required</span>
                  </div>
                )}
              </div>
            </div>

            {/* Answers Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h4 className="text-lg font-semibold text-gray-800">Answer Options</h4>
                </div>
                <button
                  type="button"
                  onClick={addAnswer}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Answer
                </button>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="space-y-3">
                  {answers.map((ans, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        ans.isCorrect
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`shrink-0 w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center border-2 transition-all ${
                          ans.isCorrect
                            ? "bg-green-500 text-white border-green-500"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                      >
                        {letters[i] || i + 1}
                      </div>
                      <input
                        className="flex-1 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                        placeholder={`Enter answer option ${letters[i] || i + 1}...`}
                        value={ans.content}
                        onChange={(e) => updateAnswer(i, { content: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => toggleCorrect(i)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${
                          ans.isCorrect
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {ans.isCorrect ? (
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
                      {answers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAnswer(i)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Validation Messages */}
                <div className="mt-3 space-y-1">
                  {!validity.hasMinAnswers && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">At least 2 answers are required</span>
                    </div>
                  )}
                  {!validity.hasCorrect && validity.hasMinAnswers && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Mark at least one answer as correct</span>
                    </div>
                  )}
                  {validity.hasCorrect && validity.hasMinAnswers && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">Answers look good!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-orange-600" />
                <h4 className="text-lg font-semibold text-gray-800">Question Details</h4>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-4">
                {/* Field and Topic */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <ComboBox
                      id="field-input"
                      label="📂 Field"
                      value={field}
                      onChange={setField}
                      options={fieldsOptions}
                      placeholder="Select or type a field..."
                      description="Choose the subject area for this question"
                    />
                    {field && !fieldsOptions.includes(field) && (
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
                      label="🎯 Topic"
                      value={topic}
                      onChange={setTopic}
                      options={allowedTopics}
                      placeholder="Select or type a topic..."
                      description="Specific topic within the field"
                    />
                    {topic && !allowedTopics.includes(topic) && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          ✨ New Topic
                        </span>
                        <span className="text-xs text-gray-600">This topic will be created</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Levels */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700">Levels</label>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(levelConfig).map(([key, config]) => {
                      const active = levels.includes(key)
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setLevels((prev) => (active ? prev.filter((x) => x !== key) : [...prev, key]))}
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
                  {!validity.hasLevel && (
                    <div className="flex items-center gap-2 mt-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Select at least one difficulty level</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Explanation Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                <h4 className="text-lg font-semibold text-gray-800">Explanation</h4>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <textarea
                  className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                  rows={3}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Provides deeper understanding through logic and theory..."
                />
                {!validity.hasExplanation && (
                  <div className="flex items-center gap-2 mt-2 text-yellow-700">
                    <Lightbulb className="w-4 h-4" />
                    <span className="text-sm">Explanation is required for deeper understanding</span>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {canSubmit ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                Ready to submit
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="w-4 h-4" />
                Complete all required fields
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              disabled={submitting || !canSubmit}
              onClick={handleSubmit}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                canSubmit && !submitting
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {initial ? "Update Question" : "Create Question"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
