"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Sparkles, Star } from "lucide-react"

interface OnboardingCompleteProps {
  onContinue: () => void
}

const OnboardingComplete: React.FC<OnboardingCompleteProps> = ({ onContinue }) => {
  const [countdown, setCountdown] = useState(3)
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    
    const timer = setInterval(() => {
      if (isMountedRef.current) {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Use setTimeout to ensure this runs after the current render cycle
            setTimeout(() => {
              if (isMountedRef.current) {
                onContinue()
              }
            }, 0)
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)

    return () => {
      isMountedRef.current = false
      clearInterval(timer)
    }
  }, [onContinue])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-40"></div>
        <div className="absolute top-1/2 left-3/4 w-3 h-3 bg-indigo-400 rounded-full animate-bounce opacity-50"></div>
        <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-violet-400 rounded-full animate-pulse opacity-70"></div>
      </div>

      <Card className="w-full max-w-md text-center bg-slate-800/90 border-purple-500/30 backdrop-blur-sm shadow-2xl shadow-purple-500/20 animate-fade-in-up relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent pointer-events-none"></div>

        <CardHeader className="relative">
          <div className="mx-auto mb-6 relative">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-purple-500/50 animate-pulse-glow">
              <CheckCircle className="w-10 h-10 text-white animate-scale-in" />
            </div>
            <div className="absolute -top-2 -right-2 animate-float">
              <Star className="w-4 h-4 text-yellow-400 animate-spin-slow" />
            </div>
            <div className="absolute -bottom-1 -left-2 animate-float-delayed">
              <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
            </div>
          </div>

          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent animate-gradient-shift">
            Congratulations!
          </CardTitle>
          <p className="text-slate-300 mt-3 text-lg animate-fade-in-delayed">
            You have completed the account setup process
          </p>
        </CardHeader>

        <CardContent className="space-y-8 relative">
          <div className="space-y-4">
            {[
              { icon: Sparkles, text: "Your profile has been updated", delay: "0s" },
              { icon: Sparkles, text: "Your job position has been selected", delay: "0.2s" },
              { icon: Sparkles, text: "Your skills have been recorded", delay: "0.4s" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 text-slate-300 animate-slide-in-left"
                style={{ animationDelay: item.delay }}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-white animate-pulse" />
                </div>
                <span className="text-left">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="pt-6">
            <Button
              onClick={onContinue}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg shadow-purple-500/30 transition-all duration-300 hover:shadow-purple-500/50 hover:scale-105 animate-shimmer"
            >
              Start using
              <ArrowRight className="w-5 h-5 ml-2 animate-bounce-x" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-slate-400 animate-fade-in-delayed">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <p className="text-sm">Redirecting in {countdown} seconds...</p>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OnboardingComplete
