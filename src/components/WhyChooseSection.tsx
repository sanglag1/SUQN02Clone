"use client";

import { Brain, Clock, Shield } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: "Smart AI",
    description: "Uses GPT-4 to create suitable interview questions and accurately assess candidate capabilities",
    gradient: "from-blue-500 to-blue-600"
  },
  {
    icon: Clock,
    title: "Time Saving", 
    description: "Helps candidates practice interviews effectively, reducing 80% of their preparation time.",
    gradient: "from-purple-500 to-purple-600"
  },
  {
    icon: Shield,
    title: "Detailed Reports",
    description: "In-depth analysis of skills, personality and job fit assessment", 
    gradient: "from-green-500 to-green-600"
  }
];

export default function WhyChooseSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Why Choose F.AI Interview?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Advanced AI technology combined with optimal user experience
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
