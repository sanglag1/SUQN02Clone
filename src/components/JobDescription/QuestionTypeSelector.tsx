// components/QuestionTypeSelector.tsx
type QuestionTypeSelectorProps = {
  questionType: string;
  setQuestionType: (type: string) => void;
};

export default function QuestionTypeSelector({ questionType, setQuestionType }: QuestionTypeSelectorProps) {
    return (
      <div className="mb-4 mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Question Type</label>
        <div className="flex space-x-4">
          {['technical', 'behavioral'].map((type) => (
            <button
              key={type}
              onClick={() => setQuestionType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                questionType === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
    );
  }
  