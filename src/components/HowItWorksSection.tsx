"use client";

const steps = [
  {
    number: "1",
    title: "Create Interview",
    description: "Enter position requirements and criteria. AI will automatically generate suitable question sets",
    color: "blue"
  },
  {
    number: "2", 
    title: "Candidate Participation",
    description: "Send interview link to candidates. They can participate anytime, anywhere",
    color: "purple"
  },
  {
    number: "3",
    title: "Get Results",
    description: "Receive detailed reports on candidate capabilities and hiring recommendations",
    color: "green"
  }
];

const colorVariants = {
  blue: {
    bg: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
    ring: "ring-blue-100"
  },
  purple: {
    bg: "bg-purple-500", 
    gradient: "from-purple-500 to-purple-600",
    ring: "ring-purple-100"
  },
  green: {
    bg: "bg-green-500",
    gradient: "from-green-500 to-green-600", 
    ring: "ring-green-100"
  }
};

export default function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            How It Works
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Just 3 simple steps to get started
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-8 left-1/2 transform -translate-x-1/2 w-2/3 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => {
              const colors = colorVariants[step.color as keyof typeof colorVariants];
              return (
                <div key={index} className="text-center group">
                  {/* Step Number Circle */}
                  <div className="relative inline-block mb-8">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${colors.gradient} flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 ring-8 ${colors.ring}`}>
                      <span className="text-2xl font-bold text-white">
                        {step.number}
                      </span>
                    </div>
                  </div>
                  
                  {/* Step Content */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-600 leading-relaxed text-lg max-w-sm mx-auto group-hover:text-gray-700 transition-colors">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
