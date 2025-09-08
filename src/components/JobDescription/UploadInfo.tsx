// components/UploadInfo.tsx
import { FileText } from 'lucide-react';

export default function UploadInfo() {
  return (
    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
      <div className="flex items-start space-x-3">
        <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
        <div className="text-xs text-gray-600">
          <p className="font-medium mb-1">Supported formats:</p>
          <p>PDF, Word (.doc, .docx), Text (.txt) • Max 10MB</p>
        </div>
      </div>
    </div>
  );
}
