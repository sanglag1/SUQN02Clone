import React, { useMemo } from 'react';

interface QuestionFiltersProps {
  fields: string[]; // categories
  topics: string[]; // all skills
  searchParams: {
    field: string;
    topic: string;
    level: string; // quiz level value: junior/middle/senior
    search: string;
  };
  onChange: (next: QuestionFiltersProps['searchParams']) => void;
  topicsByField?: Record<string, string[]>; // skills by category
  levelsOptions?: string[]; // job role levels: e.g., Junior/Middle/Senior/Lead
}

const toQuizLevel = (label: string) => {
  const m = (label || '').toLowerCase();
  if (m === 'middle') return 'middle';
  if (m === 'lead') return 'senior';
  return m; // junior/senior
};

export default function QuestionFilters({ fields, topics, searchParams, onChange, topicsByField = {}, levelsOptions = ['Junior','Middle','Senior'] }: QuestionFiltersProps) {
  const filteredTopics = useMemo(() => {
    if (!searchParams.field) return topics;
    const list = topicsByField[searchParams.field];
    return (list && list.length > 0) ? list : topics;
  }, [searchParams.field, topicsByField, topics]);

  const handleFieldChange = (value: string) => {
    const next = { ...searchParams, field: value };
    // reset topic if not valid under new field
    if (value) {
      const allowed = topicsByField[value] || topics;
      if (!allowed.includes(next.topic)) next.topic = '';
    } else {
      // no field selected, keep current topic if exists in global topics
      if (next.topic && !topics.includes(next.topic)) next.topic = '';
    }
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <input
        type="text"
        placeholder="Search questions..."
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        value={searchParams.search}
        onChange={(e) => onChange({ ...searchParams, search: e.target.value })}
      />

      <select
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        value={searchParams.field}
        onChange={(e) => handleFieldChange(e.target.value)}
      >
        <option value="">All Fields</option>
        {fields.map((field) => (
          <option key={field} value={field}>{field}</option>
        ))}
      </select>

      <select
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        value={searchParams.topic}
        onChange={(e) => onChange({ ...searchParams, topic: e.target.value })}
      >
        <option value="">All Topics</option>
        {filteredTopics.map((topic) => (
          <option key={topic} value={topic}>{topic}</option>
        ))}
      </select>

      <select
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        value={searchParams.level}
        onChange={(e) => onChange({ ...searchParams, level: e.target.value })}
      >
        <option value="">All Levels</option>
        {levelsOptions.map((label) => {
          const val = toQuizLevel(label);
          return <option key={label} value={val}>{label}</option>;
        })}
      </select>
    </div>
  );
}
