import React from 'react';

export interface QuestionRow {
  id: string;
  question: string;
  answers: { content: string; isCorrect?: boolean }[];
  fields: string[];
  topics: string[];
  levels: string[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface QuestionTableProps {
  questions: QuestionRow[];
  pagination: Pagination;
  onEdit: (q: QuestionRow) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}

export default function QuestionTable({ questions, pagination, onEdit, onDelete, onPageChange }: QuestionTableProps) {
  return (
    <>
      <div className="overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fields</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topics</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Levels</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Answers</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {questions.map((q, idx) => (
                <tr key={q.id} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                  <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-800">
                    {q.question}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {q.fields.map((field) => (
                        <span key={field} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {field}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {q.topics.map((topic) => (
                        <span key={topic} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {q.levels.map((level) => (
                        <span key={level} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 capitalize">
                          {level}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                      {(Array.isArray(q.answers) ? q.answers : []).map((a, i) => (
                        <li key={i} className={a.isCorrect ? 'text-green-700 font-medium' : ''}>{a.content}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="inline-flex items-center gap-2">
                      <button onClick={() => onEdit(q)} className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition text-gray-700">Edit</button>
                      <button onClick={() => onDelete(q.id)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>{' '}
            of <span className="font-medium">{pagination.total}</span> questions
          </div>
          <div className="flex space-x-2">
            <button onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page === 1} className={`px-3 py-1.5 border rounded-md ${pagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Previous</button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) pageNum = i + 1;
              else if (pagination.page <= 3) pageNum = i + 1;
              else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
              else pageNum = pagination.page - 2 + i;
              return (
                <button key={pageNum} onClick={() => onPageChange(pageNum)} className={`px-3 py-1.5 border rounded-md ${pagination.page === pageNum ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{pageNum}</button>
              );
            })}
            <button onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className={`px-3 py-1.5 border rounded-md ${pagination.page === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Next</button>
          </div>
        </div>
      )}
    </>
  );
}
