// components/QuestionsDisplay.tsx
import { Copy, Download, MessageCircle, ArrowRight, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type QuestionsDisplayProps = {
  questions: string[];
  copyQuestions: () => void;
  downloadQuestions: () => void;
  clearSession?: () => void;
  currentQuestionSetId?: string | null;
  onQuestionClick?: (question: string, index: number) => void;
};

export default function QuestionsDisplay({ questions, copyQuestions, downloadQuestions, clearSession, currentQuestionSetId, onQuestionClick }: QuestionsDisplayProps) {
  const router = useRouter();
  const handleQuestionClick = (question: string, index: number) => {
    if (onQuestionClick) {
      onQuestionClick(question, index);
    } else {
      // Default behavior: navigate to interview page with question content
      const cleanQuestion = question.replace(/^(\d+\.\s*)+/, '').trim();
      const url = `/jd-interview/${index}?question=${encodeURIComponent(cleanQuestion)}&type=JD-Generated&questionIndex=${index}&context=jd`;
      // Add questionSetId to URL if available so we can return to the same state
      if (currentQuestionSetId) {
        const finalUrl = `${url}&questionSetId=${currentQuestionSetId}&returnUrl=${encodeURIComponent('/jd?questionSetId=' + currentQuestionSetId)}`;
        router.push(finalUrl);
      } else {
        const finalUrl = `${url}&returnUrl=${encodeURIComponent('/jd')}`;
        router.push(finalUrl);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Interview Questions Ready</h3>
            <p className="text-sm text-gray-600">{questions.length} questions generated from your job description</p>
          </div>
        </div>
        
        {questions.length > 0 && (
          <div className="flex space-x-3">
            <button 
              onClick={copyQuestions} 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
            >
              <Copy className="w-4 h-4 mr-2" /> 
              Copy All
            </button>            <button 
              onClick={downloadQuestions} 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 border-2 border-transparent rounded-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Download className="w-4 h-4 mr-2" /> 
              Download
            </button>
            {clearSession && (
              <button 
                onClick={clearSession} 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-white border-2 border-red-300 rounded-xl hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" /> 
                Clear Session
              </button>
            )}
          </div>
        )}
      </div>

      {/* Questions List */}
      {questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div 
              key={i} 
              onClick={() => handleQuestionClick(q, i)}
              className="group relative bg-white border-2 border-gray-200 rounded-2xl p-6 cursor-pointer hover:border-purple-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <span className="text-white text-lg font-bold">{i + 1}</span>
                  </div>
                </div>
                  <div className="flex-1 min-w-0">
                  <p className="text-lg font-medium text-gray-900 leading-relaxed mb-2 group-hover:text-purple-700 transition-colors duration-200">
                    {q.replace(/^(\d+\.\s*)+/, '')}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 mr-3">
                      Interview Question
                    </span>
                    <span>Click to practice this question</span>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-purple-100 transition-colors duration-200">
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors duration-200" />
                  </div>
                </div>
              </div>
              
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Generated Yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">Upload and process a job description above to see AI-generated interview questions here.</p>
        </div>
      )}
    </div>
  );
}