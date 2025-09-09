"use client";
import React, { useEffect, useMemo, useState } from "react";

type Template = {
  id: string;
  name: string;
  questionSetId: string;
  timeLimit?: number | null;
  shuffle: boolean;
  sectionRules?: any;
  scoringPolicy?: any;
  retakePolicy?: any;
  isActive: boolean;
};

type Paged<T> = { data: T[]; page: number; pageSize: number; total: number };

export default function AdminQuizTemplatesPage() {
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [questionSetId, setQuestionSetId] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [name, setName] = useState("");
  const [setId, setSetId] = useState("");
  const [timeLimit, setTimeLimit] = useState<string>("");
  const [shuffle, setShuffle] = useState(true);
  const [sectionRules, setSectionRules] = useState("{}");
  const [scoringPolicy, setScoringPolicy] = useState("{}");
  const [retakePolicy, setRetakePolicy] = useState("{}");
  const [isActive, setIsActive] = useState(true);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (questionSetId) p.set("questionSetId", questionSetId);
    return p.toString();
  }, [search, questionSetId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/qb2/quiz-templates?${query}`, { cache: "no-store" });
      const json: Paged<Template> = await res.json();
      if (!res.ok) throw new Error((json as any)?.error || "Failed to load");
      setItems(json.data);
    } catch (e: any) {
      setError(e.message || String(e));
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
    setName("");
    setSetId("");
    setTimeLimit("");
    setShuffle(true);
    setSectionRules("{}");
    setScoringPolicy("{}");
    setRetakePolicy("{}");
    setIsActive(true);
    setFormOpen(true);
  }

  function openEdit(row: Template) {
    setEditing(row);
    setName(row.name);
    setSetId(row.questionSetId);
    setTimeLimit(row.timeLimit ? String(row.timeLimit) : "");
    setShuffle(!!row.shuffle);
    setSectionRules(JSON.stringify(row.sectionRules || {}, null, 2));
    setScoringPolicy(JSON.stringify(row.scoringPolicy || {}, null, 2));
    setRetakePolicy(JSON.stringify(row.retakePolicy || {}, null, 2));
    setIsActive(!!row.isActive);
    setFormOpen(true);
  }

  async function submitForm() {
    try {
      const payload = {
        questionSetId: setId,
        name,
        timeLimit: timeLimit ? Number(timeLimit) : null,
        shuffle,
        sectionRules: JSON.parse(sectionRules || "{}"),
        scoringPolicy: JSON.parse(scoringPolicy || "{}"),
        retakePolicy: JSON.parse(retakePolicy || "{}"),
        isActive,
      };
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/admin/qb2/quiz-templates/${editing.id}` : "/api/admin/qb2/quiz-templates";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Save failed");
      setFormOpen(false);
      await load();
    } catch (e: any) {
      alert(e.message || String(e));
    }
  }

  async function remove(id: string) {
    if (!confirm("Xóa template này?")) return;
    const res = await fetch(`/api/admin/qb2/quiz-templates/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json();
      alert(j?.error || "Delete failed");
      return;
    }
    await load();
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Question Bank - Quiz Templates</h1>
        <button className="ml-auto px-3 py-2 rounded bg-blue-600 text-white" onClick={openCreate}>Tạo template</button>
      </div>

      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-sm">Tìm kiếm</label>
          <input className="border px-2 py-1 rounded min-w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">QuestionSetId</label>
          <input className="border px-2 py-1 rounded min-w-64" value={questionSetId} onChange={(e) => setQuestionSetId(e.target.value)} />
        </div>
        <button className="px-3 py-2 rounded border" onClick={load} disabled={loading}>Lọc</button>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      <div className="overflow-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border">Name</th>
              <th className="text-left p-2 border">QuestionSetId</th>
              <th className="text-left p-2 border">TimeLimit</th>
              <th className="text-left p-2 border">Shuffle</th>
              <th className="text-left p-2 border">Active</th>
              <th className="text-left p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="p-2 border align-top">{row.name}</td>
                <td className="p-2 border align-top">{row.questionSetId}</td>
                <td className="p-2 border align-top">{row.timeLimit ?? "-"}</td>
                <td className="p-2 border align-top">{row.shuffle ? "Yes" : "No"}</td>
                <td className="p-2 border align-top">{row.isActive ? "Yes" : "No"}</td>
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
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded shadow max-w-3xl w-full p-4 space-y-3">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold">{editing ? "Sửa template" : "Tạo template"}</h2>
              <button className="ml-auto px-3 py-1" onClick={() => setFormOpen(false)}>Đóng</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Name</label>
                <input className="w-full border p-2 rounded" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">QuestionSetId</label>
                <input className="w-full border p-2 rounded" value={setId} onChange={(e) => setSetId(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">TimeLimit (seconds)</label>
                <input className="w-full border p-2 rounded" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">Shuffle</label>
                <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm">Section Rules (JSON)</label>
                <textarea className="w-full border p-2 rounded min-h-24" value={sectionRules} onChange={(e) => setSectionRules(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm">Scoring Policy (JSON)</label>
                <textarea className="w-full border p-2 rounded min-h-24" value={scoringPolicy} onChange={(e) => setScoringPolicy(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm">Retake Policy (JSON)</label>
                <textarea className="w-full border p-2 rounded min-h-24" value={retakePolicy} onChange={(e) => setRetakePolicy(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">Active</label>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
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



