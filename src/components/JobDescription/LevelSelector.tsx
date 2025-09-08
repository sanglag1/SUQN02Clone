// components/LevelSelector.tsx
type LevelSelectorProps = {
  level: string;
  setLevel: (level: string) => void;
};

export default function LevelSelector({ level, setLevel }: LevelSelectorProps) {
  const levels = [
    { value: 'junior', label: 'Junior', description: 'Entry-level, recent graduates' },
    { value: 'mid', label: 'Mid-level', description: '2-5 years experience' },
    { value: 'senior', label: 'Senior', description: '5+ years, leadership experience' }
  ];

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Experience Level
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {levels.map((levelOption) => (
          <button
            key={levelOption.value}
            onClick={() => setLevel(levelOption.value)}
            className={`p-3 rounded-lg text-left border-2 transition-all ${
              level === levelOption.value
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-25'
            }`}
          >
            <div className="font-medium text-sm">{levelOption.label}</div>
            <div className="text-xs text-gray-500 mt-1">{levelOption.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
