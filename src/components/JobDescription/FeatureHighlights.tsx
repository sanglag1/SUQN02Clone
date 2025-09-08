// components/FeatureHighlights.tsx
import { Upload, FileText, CheckCircle2 } from 'lucide-react';

export default function FeatureHighlights() {
  const features = [
    { icon: <Upload className="text-purple-600" />, title: 'Easy Upload', desc: 'Drag and drop or click to upload' },
    { icon: <FileText className="text-blue-600" />, title: 'Smart Analysis', desc: 'AI analyzes your JD' },
    { icon: <CheckCircle2 className="text-green-600" />, title: 'Generate Questions', desc: 'Get tailored questions instantly' },
  ];

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <div key={i} className={`text-center p-4 rounded-lg bg-${['purple', 'blue', 'green'][i]}-50`}>
          <div className="w-6 h-6 mx-auto mb-2">{f.icon}</div>
          <h3 className="font-medium text-gray-900 mb-1 text-sm">{f.title}</h3>
          <p className="text-xs text-gray-600">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}
