"use client";

import { ArrowRight } from 'lucide-react';
import InterviewCard from '@/components/InterviewCard';
import BackgroundMeteors from '@/components/ui/backgroundmeteors';
import { AnimatedButton } from '@/components/ui/animated-button';
import Typeanimation from '@/components/ui/Typeanimation';

export default function HeroSection() {
  return (
    <BackgroundMeteors>
      <section className="px-4 md:px-12 py-16 md:py-24 max-w-7xl mx-auto min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center w-full">
          {/* Left Content */}
          <div className="space-y-8">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Smart Interviews with{' '}
              <Typeanimation
                words={[
                  "F.AI Interview",
                  "Full Stack Interview",
                  "Frontend Interview",
                  "Backend Interview",
                  "DevOps Interview",
                  "Data Science Interview",
                  "Cybersecurity Interview",
                  "AI Interview",
                ]}
                className="text-4xl md:text-6xl lg:text-7xl font-bold"
                typingSpeed={80}
                deletingSpeed={50}
                pauseDuration={2000}
                gradientFrom="blue-400"
                gradientTo="purple-400"
              />
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
              Advanced F.AI interview platform helping businesses recruit efficiently and candidates 
              prepare optimally for their interviews.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <AnimatedButton
                variant="glow"
                size="lg"
                glow={true}
                shimmerColor="#8b5cf6"
                background="linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)"
                shimmerSize="0"
                className="text-white font-semibold text-lg shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(139,92,246,0.4)] transform hover:-translate-y-2 transition-all duration-300 hover:scale-105"
                onClick={() => window.location.href = '/sign-up'}
              >
                Start Interview Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </AnimatedButton>
          
            </div>
          </div>

          {/* Right Content */}
          <div className="relative space-y-6">
            <InterviewCard />
          </div>
        </div>
        
      </section>
    </BackgroundMeteors>
  );
}