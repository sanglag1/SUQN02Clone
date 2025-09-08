import React from 'react';
import { MessageCircle, Copy, Download } from 'lucide-react';

type GeneratedQuestionsDisplayProps = {
  questions: string[];
  copyQuestions: () => void;
  downloadQuestions: () => void;
};

const GeneratedQuestionsDisplay: React.FC<GeneratedQuestionsDisplayProps> = ({ questions, copyQuestions, downloadQuestions }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Generated Questions</h2>
          {questions.length > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={copyQuestions}
                className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </button>
              <button
                onClick={downloadQuestions}
                className="inline-flex items-center px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </button>
            </div>
          )}
        </div>

        {questions.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {questions.map((question, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border-l-4 border-purple-500">
                <div className="flex items-start space-x-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-500 text-white text-xs font-medium rounded-full flex-shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {question.replace(/^\d+\.\s*/, '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">
              Upload and process a job description to see generated interview questions here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratedQuestionsDisplay;
