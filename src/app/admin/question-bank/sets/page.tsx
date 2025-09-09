"use client";
import React, { useEffect, useMemo, useState } from "react";

type QuestionItem = { id: string; stem: string; type?: string; level?: string | null };
type SetItem = { questionId: string; order?: number; section?: string; weight?: number; isRequired?: boolean; timeSuggestion?: number | null; question?: QuestionItem };
type QuestionSet = { id: string; name: string; status: string; version: number; jobRoleId?: string | null; level?: string | null; jobRole?: { title: string } | null; items: SetItem[] };
type Paged<T> = { data: T[]; page: number; pageSize: number; total: number };

export default function AdminQuestionSetsPage() {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    return p.toString();
  }, [search]);

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [jobRoleId, setJobRoleId] = useState("");
  const [level, setLevel] = useState("");

  const [editing, setEditing] = useState<QuestionSet | null>(null);
  const [items, setItems] = useState<SetItem[]>([]);
  const [itemsOpen, setItemsOpen] = useState(false);
  // Question picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerType, setPickerType] = useState("");
  const [pickerLevel, setPickerLevel] = useState("");
  const [pickerPage, setPickerPage] = useState(1);
  const [pickerSkills, setPickerSkills] = useState("");
  const [pickerList, setPickerList] = useState<QuestionItem[]>([]);
  const [pickerTotal, setPickerTotal] = useState<number>(0);
  const [pickerSel, setPickerSel] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/qb2/question-sets?${query}`, { cache: "no-store" });
      const json: Paged<QuestionSet> = await res.json();
      if (!res.ok) {
        const errMsg = (json as unknown as { error?: string })?.error || "Failed to load";
        throw new Error(errMsg);
      }
      setSets(json.data);
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
    setFormOpen(true);
    setName("");
    setJobRoleId("");
    setLevel("");
  }

  async function submitCreate() {
    const payload: { name: string; jobRoleId?: string; level?: string } = { name };
    if (jobRoleId) payload.jobRoleId = jobRoleId;
    if (level) payload.level = level;
    const res = await fetch("/api/admin/qb2/question-sets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const j = await res.json();
    if (!res.ok) {
      alert((j as { error?: string })?.error || "Create failed");
      return;
    }
    setFormOpen(false);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Xóa bộ câu hỏi này?")) return;
    const res = await fetch(`/api/admin/qb2/question-sets/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json();
      alert((j as { error?: string })?.error || "Delete failed");
      return;
    }
    await load();
  }

  async function openItems(set: QuestionSet) {
    setEditing(set);
    const res = await fetch(`/api/admin/qb2/question-sets/${set.id}/items`, { cache: "no-store" });
    const j = await res.json();
    setItems((j as { data?: SetItem[] })?.data || []);
    setItemsOpen(true);
  }

  function updateItem(idx: number, patch: Partial<SetItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { questionId: "", order: prev.length }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function saveItems() {
    if (!editing) return;
    const payload = items.map((it, idx) => ({
      questionId: it.questionId,
      order: it.order ?? idx,
      section: it.section || null,
      weight: it.weight ?? 1,
      isRequired: it.isRequired ?? true,
      timeSuggestion: it.timeSuggestion ?? null,
    }));
    const res = await fetch(`/api/admin/qb2/question-sets/${editing.id}/items`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const j = await res.json();
    if (!res.ok) {
      alert((j as { error?: string })?.error || "Save failed");
      return;
    }
    setItemsOpen(false);
    await load();
  }

  // Picker helpers
  async function loadPicker() {
    const p = new URLSearchParams();
    p.set("page", String(pickerPage));
    p.set("pageSize", "10");
    if (pickerSearch) p.set("search", pickerSearch);
    if (pickerType) p.set("type", pickerType);
    if (pickerLevel) p.set("level", pickerLevel);
    if (pickerSkills) p.set("skills", pickerSkills);
    const res = await fetch(`/api/admin/qb2/questions?${p.toString()}`, { cache: "no-store" });
    const j = await res.json();
    if (res.ok) {
      setPickerList(((j as { data?: QuestionItem[] })?.data) || []);
      setPickerTotal(((j as { total?: number })?.total) || 0);
    }
  }

  useEffect(() => {
    if (pickerOpen) {
      loadPicker();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerOpen, pickerPage]);

  function applyPicked() {
    const chosen = pickerList.filter((q) => pickerSel[q.id]);
    if (!chosen.length) { setPickerOpen(false); return; }
    setItems((prev) => [
      ...prev,
      ...chosen.map((q, i) => ({
        questionId: q.id,
        order: (prev.length + i),
        weight: 1,
        isRequired: true,
      })),
    ]);
    setPickerSel({});
    setPickerOpen(false);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Question Bank - Question Sets</h1>
        <button className="ml-auto px-3 py-2 rounded bg-blue-600 text-white" onClick={openCreate}>Tạo bộ câu hỏi</button>
      </div>

      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-sm">Tìm kiếm</label>
          <input className="border px-2 py-1 rounded min-w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="px-3 py-2 rounded border" onClick={load} disabled={loading}>Lọc</button>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      <div className="overflow-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border">Name</th>
              <th className="text-left p-2 border">Status</th>
              <th className="text-left p-2 border">JobRole</th>
              <th className="text-left p-2 border">Level</th>
              <th className="text-left p-2 border">Version</th>
              <th className="text-left p-2 border">Items</th>
              <th className="text-left p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="p-2 border align-top">{s.name}</td>
                <td className="p-2 border align-top">{s.status}</td>
                <td className="p-2 border align-top">{s.jobRole?.title || '-'}</td>
                <td className="p-2 border align-top">{s.level || '-'}</td>
                <td className="p-2 border align-top">{s.version}</td>
                <td className="p-2 border align-top">{s.items?.length ?? 0}</td>
                <td className="p-2 border align-top">
                  <div className="flex gap-2">
                    <button className="px-2 py-1 rounded border" onClick={() => openItems(s)}>Quản lý items</button>
                    <button className="px-2 py-1 rounded border text-red-600" onClick={() => remove(s.id)}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded shadow max-w-xl w-full p-4 space-y-3">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold">Tạo bộ câu hỏi</h2>
              <button className="ml-auto px-3 py-1" onClick={() => setFormOpen(false)}>Đóng</button>
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-sm">Name</label>
                <input className="w-full border p-2 rounded" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">JobRoleId (tùy chọn)</label>
                <input className="w-full border p-2 rounded" value={jobRoleId} onChange={(e) => setJobRoleId(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">Level (junior/middle/senior)</label>
                <input className="w-full border p-2 rounded" value={level} onChange={(e) => setLevel(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded border" onClick={() => setFormOpen(false)}>Hủy</button>
              <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={submitCreate}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      {itemsOpen && editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded shadow max-w-4xl w-full p-4 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold">Items - {editing.name}</h2>
              <button className="ml-auto px-3 py-1" onClick={() => setItemsOpen(false)}>Đóng</button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <label className="block text-xs">QuestionId</label>
                    <input className="w-full border p-2 rounded" value={it.questionId} onChange={(e) => updateItem(idx, { questionId: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs">Order</label>
                    <input type="number" className="w-full border p-2 rounded" value={it.order ?? idx} onChange={(e) => updateItem(idx, { order: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-xs">Section</label>
                    <input className="w-full border p-2 rounded" value={it.section || ""} onChange={(e) => updateItem(idx, { section: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs">Weight</label>
                    <input type="number" className="w-full border p-2 rounded" value={it.weight ?? 1} onChange={(e) => updateItem(idx, { weight: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-xs">Required</label>
                    <input type="checkbox" checked={it.isRequired ?? true} onChange={(e) => updateItem(idx, { isRequired: e.target.checked })} />
                  </div>
                  <div>
                    <label className="block text-xs">Time (s)</label>
                    <input type="number" className="w-full border p-2 rounded" value={it.timeSuggestion ?? 0} onChange={(e) => updateItem(idx, { timeSuggestion: Number(e.target.value) || 0 })} />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button className="px-2 py-1 rounded border" onClick={() => removeItem(idx)}>Xóa</button>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <button className="px-3 py-2 rounded border" onClick={addItem}>Thêm Item</button>
                <button className="px-3 py-2 rounded border" onClick={() => setPickerOpen(true)}>Chọn từ ngân hàng câu hỏi</button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded border" onClick={() => setItemsOpen(false)}>Hủy</button>
              <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={saveItems}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded shadow max-w-4xl w-full p-4 space-y-3">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold">Chọn câu hỏi</h2>
              <button className="ml-auto px-3 py-1" onClick={() => setPickerOpen(false)}>Đóng</button>
            </div>
            <div className="flex gap-2 items-end">
              <div>
                <label className="block text-sm">Tìm kiếm</label>
                <input className="border p-2 rounded" value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">Type</label>
                <select className="border p-2 rounded" value={pickerType} onChange={(e) => setPickerType(e.target.value)}>
                  <option value="">All</option>
                  <option value="single_choice">single_choice</option>
                  <option value="multiple_choice">multiple_choice</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">Level</label>
                <select className="border p-2 rounded" value={pickerLevel} onChange={(e) => setPickerLevel(e.target.value)}>
                  <option value="">All</option>
                  <option value="junior">junior</option>
                  <option value="middle">middle</option>
                  <option value="senior">senior</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">Skills (comma)</label>
                <input className="border p-2 rounded" value={pickerSkills} onChange={(e)=>setPickerSkills(e.target.value)} />
              </div>
              <button className="px-3 py-2 rounded border" onClick={() => { setPickerPage(1); loadPicker(); }}>Lọc</button>
            </div>
            <div className="max-h-[50vh] overflow-auto border rounded">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left">Chọn</th>
                    <th className="p-2 text-left">Stem</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {pickerList.map((q) => (
                    <tr key={q.id} className="border-t">
                      <td className="p-2">
                        <input type="checkbox" checked={!!pickerSel[q.id]} onChange={(e) => setPickerSel((prev) => ({ ...prev, [q.id]: e.target.checked }))} />
                      </td>
                      <td className="p-2 max-w-xl truncate">{q.stem}</td>
                      <td className="p-2">{q.type}</td>
                      <td className="p-2">{q.level || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Tổng: {pickerTotal}</div>
              <div className="flex gap-2">
                <button className="px-3 py-2 rounded border" disabled={pickerPage<=1} onClick={() => setPickerPage((p)=>Math.max(1,p-1))}>Trước</button>
                <button className="px-3 py-2 rounded border" onClick={() => setPickerPage((p)=>p+1)}>Sau</button>
                <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={applyPicked}>Thêm vào bộ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



