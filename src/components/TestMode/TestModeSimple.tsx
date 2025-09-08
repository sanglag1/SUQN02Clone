/**
 * TestMode.tsx
 * Simplified component for the test mode interview flow
 */

import React, { useState } from 'react';

// Interface cho dữ liệu chủ đề
type TopicType = {
  name: string;
  selected: boolean;
}

export default function TestModeSimple() {
  // State management
  const [jobDescription, setJobDescription] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [positionLevel, setPositionLevel] = useState('Mid-level');
  const [step, setStep] = useState<'input' | 'topics' | 'interview' | 'feedback' | 'complete'>('input');
  const [error, setError] = useState<string | null>(null);

  // Simple mock topics for demonstration
  const topics: TopicType[] = [
    { name: 'React', selected: false },
    { name: 'TypeScript', selected: true },
    { name: 'Next.js', selected: false }
  ];

  const handleStartInterview = () => {
    if (!jobDescription) {
      setError('Please enter a job description');
      return;
    }
    setStep('topics');
  };

  const handleTopicSelection = () => {
    setStep('interview');
  };

  const handleSubmitAnswer = () => {
    setStep('feedback');
  };

  const handleNextQuestion = () => {
    setStep('complete');
  };

  const handleReset = () => {
    setJobDescription('');
    setCandidateName('');
    setPositionLevel('Mid-level');
    setStep('input');
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">AI Technical Interview Simulator</h1>

      {step === 'input' && (
        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Start a New Interview</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block mb-2">Job Description</label>
              <textarea
                className="w-full border p-2 rounded"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                placeholder="Paste the job description here..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Your Name (Optional)</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <label className="block mb-2">Position Level</label>
                <select
                  className="w-full border p-2 rounded"
                  value={positionLevel}
                  onChange={(e) => setPositionLevel(e.target.value)}
                >
                  <option value="Junior">Junior</option>
                  <option value="Mid-level">Mid-level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                </select>
              </div>
            </div>
          </div>
          
          {error && <div className="text-red-500 mb-4">{error}</div>}
          
          <button
            className="bg-blue-500 text-white py-2 px-4 rounded"
            onClick={handleStartInterview}
          >
            Start Interview
          </button>
        </div>
      )}

      {step === 'topics' && (
        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Select Topics</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {topics.map((topic) => (
              <div
                key={topic.name}
                className={`p-3 border rounded cursor-pointer ${
                  topic.selected ? 'bg-blue-50 border-blue-300' : ''
                }`}
              >
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={topic.selected} readOnly />
                  <span>{topic.name}</span>
                </label>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between">
            <button
              className="bg-gray-300 py-2 px-4 rounded"
              onClick={() => setStep('input')}
            >
              Back
            </button>
            
            <button
              className="bg-blue-500 text-white py-2 px-4 rounded"
              onClick={handleTopicSelection}
            >
              Start Interview
            </button>
          </div>
        </div>
      )}

      {step === 'interview' && (
        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Interview Question</h2>
          
          <div className="bg-gray-50 p-4 rounded mb-4">
            <div className="font-semibold">Topic: TypeScript</div>
            <div className="text-lg mt-2">
              Explain the difference between interfaces and types in TypeScript.
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2">Your Answer:</label>
            <textarea
              className="w-full border p-2 rounded"
              rows={8}
              placeholder="Type your answer here..."
            />
          </div>
          
          <button
            className="w-full bg-blue-500 text-white py-2 rounded"
            onClick={handleSubmitAnswer}
          >
            Submit Answer
          </button>
        </div>
      )}

      {step === 'feedback' && (
        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Answer Feedback</h2>
          
          <div className="bg-blue-50 p-4 rounded border border-blue-200 mb-4">
            <div className="font-semibold">Score: 8/10</div>
            <div className="mt-2">
              Your answer demonstrated a good understanding of TypeScript interfaces and types.
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Strengths</h3>
              <ul className="list-disc pl-5">
                <li>Clear explanation of interfaces</li>
                <li>Good examples provided</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Areas to Improve</h3>
              <ul className="list-disc pl-5">
                <li>Expand on declaration merging</li>
                <li>Discuss performance implications</li>
              </ul>
            </div>
          </div>
          
          <button
            className="w-full bg-blue-500 text-white py-2 rounded"
            onClick={handleNextQuestion}
          >
            Next Question
          </button>
        </div>
      )}

      {step === 'complete' && (
        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Interview Assessment</h2>
          
          <div className="bg-blue-50 p-4 rounded border border-blue-200 mb-6">
            <div className="font-bold text-xl mb-2">Overall Score: 85/100</div>
            <div className="mb-4">
              You demonstrated strong technical knowledge with good communication skills.
            </div>
            
            <div className="mb-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded">
                Recommendation: Yes
              </span>
            </div>
          </div>
          
          <button
            className="w-full bg-blue-500 text-white py-2 rounded"
            onClick={handleReset}
          >
            Start New Interview
          </button>
        </div>
      )}
    </div>
  );
}
