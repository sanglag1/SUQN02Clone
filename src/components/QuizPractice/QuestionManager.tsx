"use client";

import React, { useEffect, useState } from "react";
import QuestionFilters from "./QuestionFilters";
import QuestionForm, { QuestionPayload } from "./QuestionForm";
import QuestionTable, { QuestionRow } from "./QuestionTable";
import AIQuestionGenerator from "./AIQuestionGenerator";

interface Pagination { page: number; limit: number; total: number; totalPages: number; }

// Shape returned by /api/questions items
interface ApiQuestionItem {
  id: string;
  question: string;
  answers?: { content: string; isCorrect?: boolean }[];
  fields?: string[];
  topics?: string[];
  levels?: string[];
}

// Position (job role) shape from /api/positions (approx)
interface ApiPositionItem {
  id: string;
  title: string;
  level?: string;
  category?: { id: string; name: string; skills?: string[] } | null;
  specialization?: { id: string; name: string } | null;
}

export default function QuestionManager() {
  const [fields, setFields] = useState<string[]>([]);
  // skills for AI generator (topic=skill)
  const [skillsByField, setSkillsByField] = useState<Record<string, string[]>>({});
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [levelsOptions, setLevelsOptions] = useState<string[]>([]);

  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState({ field: "", topic: "", level: "", search: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionRow | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const posRes = await fetch("/api/positions");
        if (!posRes.ok) throw new Error("Failed to fetch positions");

        const positions: ApiPositionItem[] = await posRes.json();
        const fieldSet = new Set<string>();
        const skillsMap: Record<string, Set<string>> = {};
        const levelSet = new Set<string>();

        positions.forEach((p) => {
          const fieldName = p.category?.name;
          if (fieldName) fieldSet.add(fieldName);

          const skills = p.category?.skills || [];
          if (fieldName && skills.length) {
            if (!skillsMap[fieldName]) skillsMap[fieldName] = new Set<string>();
            skills.forEach(s => skillsMap[fieldName].add(s));
          }
          if (p.level) levelSet.add(p.level);
        });

        const skillsByFieldObj: Record<string, string[]> = {};
        Object.entries(skillsMap).forEach(([k, v]) => { skillsByFieldObj[k] = Array.from(v).sort(); });

        setFields(Array.from(fieldSet).sort());
        setSkillsByField(skillsByFieldObj);
        setAllSkills(Array.from(new Set(Object.values(skillsByFieldObj).flat())).sort());
        setLevelsOptions(Array.from(levelSet).sort());
      } catch (e) {
        console.error(e);
        setFields([]);
        setSkillsByField({});
        setAllSkills([]);
        setLevelsOptions(["Junior","Middle","Senior"]);
      }
    };
    loadMeta();
  }, []);

  const fetchQuestions = React.useCallback(async (page = pagination.page) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
      });
      if (searchParams.search) params.set("search", searchParams.search);
      if (searchParams.field) params.set("field", searchParams.field);
      if (searchParams.topic) params.set("topic", searchParams.topic);
      if (searchParams.level) params.set("level", searchParams.level);

      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();
      const list: ApiQuestionItem[] = (data?.data as ApiQuestionItem[]) ?? (data as ApiQuestionItem[]) ?? [];
      const rows: QuestionRow[] = list.map((q) => ({
        id: q.id,
        question: q.question,
        answers: Array.isArray(q.answers) ? q.answers : [],
        fields: q.fields ?? [],
        topics: q.topics ?? [],
        levels: q.levels ?? [],
      }));
      const total = data?.pagination?.total ?? rows.length;
      const totalPages = data?.pagination?.totalPages ?? 1;
      setQuestions(rows);
      setPagination((p) => ({ ...p, page, total, totalPages }));
    } catch {
      setError("Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchParams]);

useEffect(() => { fetchQuestions(pagination.page); }, [fetchQuestions, pagination.page]);

  const handleCreate = () => { setEditing(null); setFormOpen(true); };
  const handleEdit = (q: QuestionRow) => { setEditing(q); setFormOpen(true); };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/questions/${id}`, { method: "DELETE" });
    fetchQuestions();
  };

  const handleSubmit = async (payload: QuestionPayload) => {
    if (payload.id) {
      await fetch(`/api/questions/${payload.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch(`/api/questions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    await fetchQuestions();
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 rounded-xl border bg-white/70 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-indigo-50 to-white rounded-t-xl">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Question Bank</h2>
              <p className="text-sm text-gray-500">Manage, generate and curate your quiz questions</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setAiOpen(true)} className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 transition">AI Generate</button>
              <button onClick={handleCreate} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition shadow-sm">Create Question</button>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="flex justify-between items-center">
              <QuestionFilters fields={fields} topics={allSkills} searchParams={searchParams} onChange={setSearchParams} topicsByField={skillsByField} levelsOptions={levelsOptions} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No questions found. Create your first question!</div>
        ) : (
          <div className="rounded-xl border bg-white shadow-sm">
            <QuestionTable
              questions={questions}
              pagination={pagination}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPageChange={(p) => fetchQuestions(p)}
            />
          </div>
        )}
      </div>

      <QuestionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing ? { ...editing } : null}
        onSubmit={handleSubmit}
        fieldsOptions={fields}
        topicsOptions={allSkills}
        topicsByField={skillsByField}
        levelsOptions={levelsOptions}
      />

      <AIQuestionGenerator
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        fields={fields}
        topics={allSkills}
        topicsByField={skillsByField}
        onGenerated={() => fetchQuestions()}
        levelsOptions={levelsOptions}
      />
    </div>
  );
}
