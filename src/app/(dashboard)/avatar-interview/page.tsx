"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Use dynamic import with SSR disabled for the InteractiveAvatar component
// since it depends on browser APIs
const InteractiveAvatar = dynamic(() => import("@/components/InteractiveAvatar"), { ssr: false })

export default function AvatarInterviewPage() {
  const [isInterviewStarted, setIsInterviewStarted] = useState(false)

  const handleEndSessionClick = () => {
    setIsInterviewStarted(false)
  }

  return (
    <DashboardLayout>
      {isInterviewStarted ? (
        // Interview Session View - Full screen
        <div className="w-full h-screen">
          <InteractiveAvatar onEndSession={handleEndSessionClick} />
        </div>
      ) : (
        <div className="h-screen overflow-hidden">
          {/* Hero Section */}
          <div className="relative overflow-hidden from-primary/5 via-background to-accent/5">
            <div className="relative max-w-7xl mx-auto px-6 py-8 lg:py-10">
              {/* Header with History Button */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                    <svg
                      className="w-6 h-6 text-primary-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-foreground">AI Bot Practice</h1>
                    <p className="text-muted-foreground font-medium">AI-Powered Professional Training</p>
                  </div>
                </div>
                <Link href="/avatar-interview/history">
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    View History
                  </Button>
                </Link>
              </div>

              {/* Main Content Grid */}
              <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Value Proposition */}
                  <div className="space-y-4">
                    <Badge variant="secondary" className="w-fit">
                      Enterprise-Grade Training
                    </Badge>
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                      Master Your Interview Skills with AI-Powered Practice Sessions
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Experience realistic interview scenarios with our advanced AI avatar. Get instant feedback, track
                      your progress, and build confidence for your next career opportunity.
                    </p>
                  </div>

                  {/* Features Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                            />
                          </svg>
                        </div>
                        <CardTitle className="text-lg">Natural Voice Interaction</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base">
                          Engage in fluid conversations with our AI interviewer using advanced speech recognition and
                          natural language processing.
                        </CardDescription>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mb-2">
                          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        </div>
                        <CardTitle className="text-lg">Performance Analytics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base">
                          Receive detailed insights on your communication style, response timing, and areas for
                          improvement.
                        </CardDescription>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                        <CardTitle className="text-lg">Adaptive Scenarios</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base">
                          Practice with industry-specific questions that adapt to your experience level and target role.
                        </CardDescription>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mb-2">
                          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                        <CardTitle className="text-lg">Instant Feedback</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base">
                          Get real-time coaching on your responses, body language, and overall interview presence.
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Right Column - Tips & CTA */}
                <div className="space-y-6">
                  {/* Professional Tips Card */}
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-muted/50 to-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                        Success Strategies
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {[
                          "Structure responses using the STAR method",
                          "Maintain confident posture and eye contact",
                          "Practice active listening techniques",
                          "Prepare thoughtful questions for the interviewer",
                          "Research company culture and values",
                        ].map((tip, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Start Interview CTA */}
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-accent/5">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="w-16 h-16 bg-primary rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-foreground">Ready to Begin?</h3>
                        <p className="text-muted-foreground">Start your personalized interview practice session</p>
                      </div>
                      <Button
                        onClick={() => setIsInterviewStarted(true)}
                        size="lg"
                        className="w-full gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Launch Interview Session
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Session includes setup wizard and customization options
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
