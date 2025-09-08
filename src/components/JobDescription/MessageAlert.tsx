// components/MessageAlert.tsx
import { CheckCircle2, AlertCircle } from 'lucide-react';

type MessageAlertProps = {
  message?: string;
  type: 'success' | 'error';
};

export default function MessageAlert({ message, type }: MessageAlertProps) {
  if (!message) return null;
  return (
    <div className={`mt-4 p-3 rounded-lg flex items-start space-x-3 ${
      type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
    }`}>
      {type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
      ) : (
        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
      )}
      <p className={`text-sm font-medium ${type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{message}</p>
    </div>
  );
}
