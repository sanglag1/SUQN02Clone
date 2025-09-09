"use client";
import React, { useEffect, useMemo, useState } from "react";

type QuestionOption = { text: string; isCorrect?: boolean; order?: number; metadata?: unknown };
type QuestionItem = {
  id: string;
  type: string;
  stem: string;
  explanation?: string | null;
  level?: string | null;
  topics: string[];
  fields: string[];
  skills: string[];
  difficulty?: number | null;
  options: QuestionOption[];
  updatedAt: string;
};

type Paged<T> = { data: T[]; page: number; pageSize: number; total: number };

export default function AdminQuestionsPage() {
  const [items, setItems] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [level, setLevel] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionItem | null>(null);

  const [stem, setStem] = useState("");
  const [qType, setQType] = useState("single_choice");
  const [qLevel, setQLevel] = useState("");
  const [topics, setTopics] = useState<string>("");
  const [fields, setFields] = useState<string>("");
  const [skills, setSkills] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");
  const [options, setOptions] = useState<QuestionOption[]>([{ text: "", isCorrect: true }, { text: "" }]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (type) p.set("type", type);
    if (level) p.set("level", level);
    if (skills) p.set("skills", skills);
    return p.toString();
  }, [search, type, level, skills]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/qb2/questions?${query}`, { cache: "no-store" });
      const json: Paged<QuestionItem> = await res.json();
      if (!res.ok) throw new Error(((json as unknown) as { error?: string })?.error || "Failed to load");
      setItems(json.data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function openCreate() {
    setEditing(null);
    setStem("");
    setQType("single_choice");
    setQLevel("");
    setTopics("");
    setFields("");
    setExplanation("");
    setOptions([{ text: "", isCorrect: true }, { text: "" }]);
    setFormOpen(true);
  }

  function openEdit(row: QuestionItem) {
    setEditing(row);
    setStem(row.stem);
    setQType(row.type);
    setQLevel(row.level || "");
    setTopics(row.topics?.join(", ") || "");
    setFields(row.fields?.join(", ") || "");
    setSkills(row.skills?.join(", ") || "");
    setDifficulty(row.difficulty != null ? String(row.difficulty) : "");
    setExplanation(row.explanation || "");
    setOptions((row.options || []).map((o) => ({ text: o.text, isCorrect: !!o.isCorrect, order: o.order })));
    setFormOpen(true);
  }

  async function submitForm() {
    const payload = {
      type: qType,
      stem,
      explanation: explanation || null,
      level: qLevel || null,
      topics: topics
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      fields: fields
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      skills: skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      difficulty: difficulty ? Number(difficulty) : null,
      options: options.map((o, idx) => ({ text: o.text, isCorrect: !!o.isCorrect, order: o.order ?? idx })),
    };

    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/qb2/questions/${editing.id}` : "/api/admin/qb2/questions";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Save failed");
    setFormOpen(false);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Xóa câu hỏi này?")) return;
    const res = await fetch(`/api/admin/qb2/questions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json();
      alert(j?.error || "Delete failed");
      return;
    }
    await load();
  }

  function updateOption(idx: number, patch: Partial<QuestionOption>) {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  }

  function addOption() {
    setOptions((prev) => [...prev, { text: "" }]);
  }

  function removeOption(idx: number) {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Question Bank - Questions</h1>
        <button className="ml-auto px-3 py-2 rounded bg-blue-600 text-white" onClick={openCreate}>Tạo câu hỏi</button>
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-sm">Tìm kiếm</label>
          <input className="border px-2 py-1 rounded min-w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Type</label>
          <select className="border px-2 py-1 rounded" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All</option>
            <option value="single_choice">single_choice</option>
            <option value="multiple_choice">multiple_choice</option>
            <option value="free_text">free_text</option>
            <option value="scale">scale</option>
            <option value="coding">coding</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Level</label>
          <select className="border px-2 py-1 rounded" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">All</option>
            <option value="junior">junior</option>
            <option value="middle">middle</option>
            <option value="senior">senior</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Skills (comma)</label>
          <input className="border px-2 py-1 rounded min-w-64" value={skills} onChange={(e) => setSkills(e.target.value)} />
        </div>
        <button className="px-3 py-2 rounded border" onClick={load} disabled={loading}>Lọc</button>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      <div className="overflow-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border">Stem</th>
              <th className="text-left p-2 border">Type</th>
              <th className="text-left p-2 border">Level</th>
              <th className="text-left p-2 border">Options</th>
              <th className="text-left p-2 border">Explanation</th>
              <th className="text-left p-2 border">Skills</th>
              <th className="text-left p-2 border">Diff</th>
              <th className="text-left p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="p-2 border align-top max-w-xl">
                  <div className="line-clamp-3">{row.stem}</div>
                </td>
                <td className="p-2 border align-top">{row.type}</td>
                <td className="p-2 border align-top">{row.level || "-"}</td>
                <td className="p-2 border align-top">
                  <ul className="list-disc ml-5 space-y-1">
                    {row.options?.map((o, i) => (
                      <li key={i} className={o.isCorrect ? "text-green-700" : ""}>{o.text}</li>
                    ))}
                  </ul>
                </td>
                <td className="p-2 border align-top max-w-md">
                  <div className="line-clamp-2 text-sm text-gray-700">{row.explanation || '-'}</div>
                </td>
                <td className="p-2 border align-top">{(row.skills||[]).slice(0,3).join(", ")}{(row.skills||[]).length>3?"…":""}</td>
                <td className="p-2 border align-top">{row.difficulty ?? "-"}</td>
                <td className="p-2 border align-top">
                  <div className="flex gap-2">
                    <button className="px-2 py-1 rounded border" onClick={() => openEdit(row)}>Sửa</button>
                    <button className="px-2 py-1 rounded border text-red-600" onClick={() => remove(row.id)}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded shadow max-w-3xl w-full p-4 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold">{editing ? "Sửa câu hỏi" : "Tạo câu hỏi"}</h2>
              <button className="ml-auto px-3 py-1" onClick={() => setFormOpen(false)}>Đóng</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm">Stem</label>
                <textarea className="w-full border p-2 rounded min-h-24" value={stem} onChange={(e) => setStem(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">Type</label>
                <select className="w-full border p-2 rounded" value={qType} onChange={(e) => setQType(e.target.value)}>
                  <option value="single_choice">single_choice</option>
                  <option value="multiple_choice">multiple_choice</option>
                  <option value="free_text">free_text</option>
                  <option value="scale">scale</option>
                  <option value="coding">coding</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">Level</label>
                <select className="w-full border p-2 rounded" value={qLevel} onChange={(e) => setQLevel(e.target.value)}>
                  <option value="">(none)</option>
                  <option value="junior">junior</option>
                  <option value="middle">middle</option>
                  <option value="senior">senior</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">Topics (comma)</label>
                <input className="w-full border p-2 rounded" value={topics} onChange={(e) => setTopics(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">Fields (comma)</label>
                <input className="w-full border p-2 rounded" value={fields} onChange={(e) => setFields(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">Skills (comma)</label>
                <input className="w-full border p-2 rounded" value={skills} onChange={(e) => setSkills(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">Difficulty (0-1 hoặc điểm số)</label>
                <input className="w-full border p-2 rounded" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm">Explanation</label>
                <textarea className="w-full border p-2 rounded min-h-20" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <div className="font-medium">Options</div>
                <button className="ml-auto px-2 py-1 rounded border" onClick={addOption}>Thêm phương án</button>
              </div>
              <div className="space-y-2">
                {options.map((o, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input className="flex-1 border p-2 rounded" placeholder={`Option #${idx + 1}`} value={o.text} onChange={(e) => updateOption(idx, { text: e.target.value })} />
                    <label className="flex items-center gap-1 text-sm">
                      <input type="checkbox" checked={!!o.isCorrect} onChange={(e) => updateOption(idx, { isCorrect: e.target.checked })} /> Correct
                    </label>
                    <button className="px-2 py-1 rounded border" onClick={() => removeOption(idx)}>Xóa</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded border" onClick={() => setFormOpen(false)}>Hủy</button>
              <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={submitForm}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




