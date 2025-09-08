"use client"

import type React from "react"
import { useCallback, useState, useEffect } from "react"
import { SessionState } from "../HeygenConfig"
import type { StartAvatarRequest } from "@heygen/streaming-avatar"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { UserPackageService, type PackageLimitInfo } from "../../../services/userPackage"
import { mapUILanguageToAI, getLanguageDisplayName } from "../../../utils/languageMapping"

interface PreInterviewSetupProps {
  config: StartAvatarRequest
  onConfigChange: (config: StartAvatarRequest) => void
  onStartInterview: () => Promise<void>
  sessionState: SessionState
  AVATARS: Array<{ avatar_id: string; name: string }>
  STT_LANGUAGE_LIST: Array<{ label: string; value: string; key: string }>
  onJobRoleIdChange: (id: string) => void
  onPositionKeyChange: (key: string) => void
  jobRoles: JobRole[]
}

interface JobRole {
  id: string
  key: string
  title: string
  level: "Intern" | "Junior" | "Mid" | "Senior" | "Lead"
  description?: string
  minExperience: number
  maxExperience?: number
  order: number
  category?: {
    id: string
    name: string
    skills?: string[]
  }
  categoryId?: string
  specialization?: {
    id: string
    name: string
  }
  specializationId?: string
}

interface UserPreferences {
  preferredJobRoleId?: string
  preferredLanguage?: string
  autoStartWithPreferences?: boolean
  preferredJobRole?: JobRole
}

const PreInterviewSetup: React.FC<PreInterviewSetupProps> = ({
  config,
  onConfigChange,
  onStartInterview,
  sessionState,
  AVATARS,
  STT_LANGUAGE_LIST,
  onJobRoleIdChange,
  onPositionKeyChange,
  jobRoles,
}) => {
  const router = useRouter()
  const { userId } = useAuth()

  // Smart search state
  const [selectedJobRole, setSelectedJobRole] = useState<JobRole | null>(null)

  // User preferences state
  const [, setUserPreferences] = useState<UserPreferences | null>(null)

  // Error state management
  const [errors, setErrors] = useState<{
    start: string
    search: string
    language: string
  }>({
    start: "",
    search: "",
    language: "",
  })

  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [packageLimitInfo, setPackageLimitInfo] = useState<PackageLimitInfo | null>(null)

  // Question bank stats
  const [questionBankStats, setQuestionBankStats] = useState<{
    totalQuestions: number
    fields: string[]
    topics: string[]
    levels: string[]
    fieldStats: Array<{ field: string; count: number }>
    topicStats: Array<{ topic: string; count: number }>
    levelStats: Array<{ level: string; count: number }>
    categoryStats?: Array<{ category: string; count: number }>
  } | null>(null)

  // Load user preferences and question bank stats on component mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!userId) return

      try {
        const response = await fetch("/api/profile/interview-preferences")
        if (response.ok) {
          const preferences = await response.json()
          setUserPreferences(preferences)

          // Auto-fill if user has preferences and autoStartWithPreferences is enabled
          if (preferences.autoStartWithPreferences && preferences.preferredJobRoleId) {
            const preferredRole = jobRoles.find((role) => role.id === preferences.preferredJobRoleId)
            if (preferredRole) {
              setSelectedJobRole(preferredRole)
              onJobRoleIdChange(preferredRole.id)
              onPositionKeyChange(preferredRole.key)
            }
          }

          // Auto-fill language if available
          if (preferences.preferredLanguage && !config.language) {
            onConfigChange({ ...config, language: preferences.preferredLanguage })
          }
        }
      } catch (error) {
        console.error("Error loading user preferences:", error)
      }
    }

    const loadQuestionBankStats = async () => {
      try {
        const response = await fetch("/api/questions/stats")
        if (response.ok) {
          const stats = await response.json()
          setQuestionBankStats(stats)
        }
      } catch (error) {
        console.error("Error loading question bank stats:", error)
      }
    }

    loadUserPreferences()
    loadQuestionBankStats()
  }, [userId, jobRoles, onJobRoleIdChange, onPositionKeyChange, config, onConfigChange])

  // Map avatar name to image in public/avatar
  const getAvatarImage = useCallback((avatarName: string): string => {
    const name = avatarName.toLowerCase()
    if (name.includes("silas")) return "/avatar/SilasHR.webp"
    if (name.includes("elenora")) return "/avatar/Elenora Tech Expert.webp"
    if (name.includes("ann")) return "/avatar/AnnTherapist.webp"
    if (name.includes("shawn")) return "/avatar/ShawnTherapist.webp"
    // fallbacks: try exact id matches
    switch (avatarName) {
      case "SilasHR":
        return "/avatar/SilasHR.webp"
      case "Elenora Tech Expert":
        return "/avatar/Elenora Tech Expert.webp"
      case "AnnTherapist":
        return "/avatar/AnnTherapist.webp"
      case "ShawnTherapist":
        return "/avatar/ShawnTherapist.webp"
      default:
        return "/logo.png"
    }
  }, [])

  // Helper functions for error management
  const setError = useCallback((field: keyof typeof errors, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }))
  }, [])

  const clearError = useCallback((field: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [field]: "" }))
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors({
      start: "",
      search: "",
      language: "",
    })
  }, [])

  // Generate search suggestions based on query

  // Validation function
  const validateForm = useCallback(() => {
    clearAllErrors()
    let isValid = true

    if (!selectedJobRole) {
      setError("search", "Please select a job role")
      isValid = false
    }

    if (!config.language) {
      setError("language", "Please select a language")
      isValid = false
    }

    // Additional validation for AI context
    if (!selectedJobRole?.category?.name) {
      setError("search", "Job role must have category information")
      isValid = false
    }

    if (!selectedJobRole?.level) {
      setError("search", "Job role must have level information")
      isValid = false
    }

    return isValid
  }, [selectedJobRole, config.language, clearAllErrors, setError])

  // Prepare AI context data
  const prepareAIContext = useCallback(() => {
    if (!selectedJobRole) return null

    return {
      jobRole: {
        id: selectedJobRole.id,
        title: selectedJobRole.title,
        level: selectedJobRole.level,
        description: selectedJobRole.description,
        experience: `${selectedJobRole.minExperience}-${selectedJobRole.maxExperience || "∞"} years`,
        category: selectedJobRole.category?.name,
        specialization: selectedJobRole.specialization?.name,
        skills: selectedJobRole.category?.skills || [],
        key: selectedJobRole.key,
      },
      language: config.language,
      aiLanguage: mapUILanguageToAI(config.language || 'en'),
      languageDisplayName: getLanguageDisplayName(config.language || 'en'),
      avatar: config.avatarName,
      timestamp: new Date().toISOString(),
      // Thêm thông tin job role để API có thể sử dụng mapping mới
      jobRoleTitle: selectedJobRole.title,
      jobRoleLevel: selectedJobRole.level,
    }
  }, [selectedJobRole, config.language, config.avatarName])

  // Handle start interview
  const handleStartInterview = useCallback(async () => {
    if (!validateForm()) {
      return
    }

    try {
      // Check package limits
      const packageCheck = await UserPackageService.checkActivePackage()

      if (!packageCheck.hasActivePackage) {
        setPackageLimitInfo(packageCheck)
        setShowUpgradeModal(true)
        return
      }

      if (!packageCheck.avatarInterviewCanUse) {
        setPackageLimitInfo(packageCheck)
        setShowUpgradeModal(true)
        return
      }

      // Prepare AI context data
      const aiContext = prepareAIContext()
      if (aiContext) {
        console.log("AI Context Data:", aiContext)
        // You can send this data to your AI service or store it for later use
      }

      setError("start", "")
      await onStartInterview()
    } catch (error) {
      console.error("Error starting interview:", error)
      setError("start", "Failed to start interview. Please try again.")
    }
  }, [validateForm, onStartInterview, setError, prepareAIContext])

  const handleConfigChange = useCallback(
    <K extends keyof StartAvatarRequest>(key: K, value: StartAvatarRequest[K]) => {
      const newConfig = { ...config, [key]: value }
      onConfigChange(newConfig)
      clearError("language")
    },
    [config, onConfigChange, clearError],
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Configure your personalized mock interview experience with our AI-powered platform
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Controls */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Choose Your Interviewer</h2>
                    <p className="text-slate-600 mt-1">Select an AI avatar to conduct your interview</p>
                  </div>
                  {config.avatarName && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-blue-700">{config.avatarName}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {AVATARS.map((avatar) => {
                    const isActive = config.avatarName === avatar.avatar_id
                    return (
                      <button
                        type="button"
                        key={avatar.avatar_id}
                        onClick={() => handleConfigChange("avatarName", avatar.avatar_id)}
                        className={`group relative text-left rounded-2xl border-2 p-4 bg-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                          isActive
                            ? "border-blue-500 shadow-lg shadow-blue-500/20 scale-105"
                            : "border-slate-200 hover:border-slate-300 hover:shadow-lg hover:scale-102"
                        }`}
                      >
                        <div
                          className={`aspect-square rounded-xl overflow-hidden ring-2 ${
                            isActive ? "ring-blue-200" : "ring-slate-100"
                          } bg-slate-100`}
                        >
                          <img
                            src={getAvatarImage(avatar.name) || "/placeholder.svg"}
                            alt={avatar.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-900 truncate">{avatar.name}</p>
                        {isActive && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Interview Language</h2>
                  <p className="text-slate-600 mt-1">Choose your preferred language for the interview</p>
                </div>
                <div className="relative">
                  <select
                    value={config.language || ""}
                    onChange={(e) => {
                      handleConfigChange("language", e.target.value)
                    }}
                    className={`w-full px-6 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white text-lg font-medium transition-all duration-200 ${
                      errors.language ? "border-red-400" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <option value="" disabled>
                      Select interview language
                    </option>
                    {STT_LANGUAGE_LIST.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.language && (
                  <div className="flex items-center gap-2 mt-3 text-red-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium">{errors.language}</span>
                  </div>
                )}
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Target Position</h2>
                  <p className="text-slate-600 mt-1">Select the role you&#39;re interviewing for</p>
                </div>

                {errors.search && (
                  <div className="flex items-center gap-3 mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium text-red-700">{errors.search}</span>
                  </div>
                )}

                {selectedJobRole && (
                  <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-50 p-6 shadow-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">{selectedJobRole.title}</h3>
                            <p className="text-blue-700 font-semibold">
                              {selectedJobRole.category?.name}
                              {selectedJobRole.specialization?.name && ` • ${selectedJobRole.specialization.name}`}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/50">
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                              Experience Level
                            </p>
                            <p className="text-lg text-slate-900 font-bold mt-1">{selectedJobRole.level}</p>
                          </div>
                          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/50">
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                              Years Required
                            </p>
                            <p className="text-lg text-slate-900 font-bold mt-1">
                              {selectedJobRole.minExperience}-{selectedJobRole.maxExperience || "∞"}
                            </p>
                          </div>
                        </div>

                        {selectedJobRole.description && (
                          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/50 mb-4">
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-2">
                              Role Description
                            </p>
                            <p className="text-slate-800 leading-relaxed">{selectedJobRole.description}</p>
                          </div>
                        )}

                        {selectedJobRole.category?.skills && selectedJobRole.category.skills.length > 0 && (
                          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/50">
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-3">
                              Key Skills
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedJobRole.category.skills.slice(0, 8).map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-full border border-blue-200 shadow-sm"
                                >
                                  {skill}
                                </span>
                              ))}
                              {selectedJobRole.category.skills.length > 8 && (
                                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-full border border-slate-200">
                                  +{selectedJobRole.category.skills.length - 8} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedJobRole(null)
                          onJobRoleIdChange("")
                          onPositionKeyChange("")
                        }}
                        className="text-slate-500 hover:text-slate-700 p-2 hover:bg-white/50 rounded-xl transition-all duration-200"
                        title="Change Selection"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Summary & Actions */}
            <div className="space-y-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Session Overview</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-600 font-medium">Interviewer</span>
                    <span className="text-slate-900 font-semibold">{config.avatarName || "Not selected"}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-600 font-medium">Language</span>
                    <span className="text-slate-900 font-semibold">{config.language || "Not selected"}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-600 font-medium">Position</span>
                    <span className="text-slate-900 font-semibold">{selectedJobRole?.title || "Not selected"}</span>
                  </div>
                </div>
              </div>

              {questionBankStats && (
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Question Bank</h3>
                      <p className="text-emerald-600 font-semibold">
                        {questionBankStats.totalQuestions} curated questions
                      </p>
                    </div>
                  </div>

                  {selectedJobRole && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <span className="text-emerald-700 font-medium">Category Match</span>
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg text-sm font-semibold">
                            {selectedJobRole.category?.name || "Unknown"}
                          </span>
                          <span className="text-emerald-600 text-sm">
                            ({(() => {
                              const catName = selectedJobRole.category?.name
                              if (!catName) return 0
                              const catStat = questionBankStats.categoryStats?.find(
                                (c) => c.category === catName,
                              )
                              return catStat?.count || 0
                            })()})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <span className="text-blue-700 font-medium">Role Match</span>
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-sm font-semibold">
                            {selectedJobRole.level}
                          </span>
                          <span className="text-blue-600 text-sm">
                            ({(() => {
                              const levelStat = questionBankStats.levelStats.find(
                                (l) => l.level === selectedJobRole.level,
                              )
                              return levelStat?.count || 0
                            })()})
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Our AI will select the most relevant questions based on your chosen role and experience level.
                    </p>
                  </div>
                </div>
              )}

              <div className="sticky bottom-0">
                {errors.start && (
                  <div className="mb-6 flex items-center gap-3 bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-lg">
                    <svg
                      className="w-6 h-6 text-red-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium">{errors.start}</span>
                  </div>
                )}
                <button
                  onClick={handleStartInterview}
                  disabled={sessionState === SessionState.CONNECTING}
                  className={`w-full py-6 px-8 rounded-2xl font-bold text-lg text-white transition-all duration-300 shadow-xl ${
                    sessionState === SessionState.CONNECTING
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 focus:ring-4 focus:ring-slate-500/20 hover:shadow-2xl hover:scale-105"
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    {sessionState === SessionState.CONNECTING ? (
                      <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <span>Begin Interview</span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {showUpgradeModal && packageLimitInfo && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-white/20">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 shadow-xl">
                    <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Upgrade Required</h3>

                  <p className="text-slate-600 mb-6 leading-relaxed">
                    {packageLimitInfo.packageName === "No Package"
                      ? "You need an active service package to access AI interview features."
                      : `You've used ${packageLimitInfo.currentUsage}/${packageLimitInfo.totalLimit} interview sessions from your ${packageLimitInfo.packageName} package.`}
                  </p>

                  {packageLimitInfo.packageName !== "No Package" && (
                    <div className="mb-6">
                      <div className="flex justify-between text-sm text-slate-600 mb-2">
                        <span className="font-medium">Usage Progress</span>
                        <span className="font-semibold">
                          {packageLimitInfo.currentUsage}/{packageLimitInfo.totalLimit}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                          style={{
                            width: `${Math.min((packageLimitInfo.currentUsage / packageLimitInfo.totalLimit) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-200">
                    <h4 className="font-bold text-slate-900 mb-4">Premium Benefits</h4>
                    <ul className="text-sm text-slate-700 space-y-3">
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span>Unlimited AI interview sessions</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span>Advanced performance analytics</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span>Priority customer support</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className="flex-1 px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-all duration-200"
                    >
                      Maybe Later
                    </button>
                    <button
                      onClick={() => {
                        setShowUpgradeModal(false)
                        router.push("/Pricing")
                      }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Upgrade Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PreInterviewSetup
