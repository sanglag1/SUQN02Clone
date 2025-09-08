import React from 'react';

type QuestionTypeSelectionProps = {
  questionType: string;
  setQuestionType: (type: string) => void;
};

const QuestionTypeSelection = ({ questionType, setQuestionType }: QuestionTypeSelectionProps) => {
  return (
    <div className="mb-4">
      <label htmlFor="questionType" className="block text-sm font-medium text-gray-700 mb-2">
        Select Question Type
      </label>
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={() => setQuestionType('technical')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
            questionType === 'technical'
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Technical
        </button>
        <button
          type="button"
          onClick={() => setQuestionType('behavioral')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
            questionType === 'behavioral'
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Behavioral
        </button>
      </div>
    </div>
  );
};

export default QuestionTypeSelection;
