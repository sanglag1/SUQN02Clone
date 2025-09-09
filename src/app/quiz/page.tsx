"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";

type SnapshotItem = {
  questionId: string;
  stem: string;
  type: string;
  options?: { text: string }[];
};

type Template = { id: string; name: string; questionSetId: string };
type SetRow = { id: string; name: string };

export default function QuizPage() {
  const { userId, isLoaded } = useAuth();
  const [mode, setMode] = useState<"template" | "set">("template");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [questionSetId, setQuestionSetId] = useState("");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [items, setItems] = useState<SnapshotItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [score, setScore] = useState<{ score: number; total: number; details?: any[] } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load public templates/sets (reusing admin endpoints for now)
  useEffect(() => {
    (async () => {
      try {
        const [tRes, sRes] = await Promise.all([
          fetch("/api/admin/qb2/quiz-templates?isActive=true", { cache: "no-store" }),
          fetch("/api/admin/qb2/question-sets", { cache: "no-store" }),
        ]);
        const tJson = await tRes.json();
        const sJson = await sRes.json();
        if (tRes.ok) setTemplates(tJson.data?.map((x: any) => ({ id: x.id, name: x.name, questionSetId: x.questionSetId })) || []);
        if (sRes.ok) setSets(sJson.data?.map((x: any) => ({ id: x.id, name: x.name })) || []);
      } catch {}
    })();
  }, []);

  async function start() {
    if (!userId) { setError("Bạn cần đăng nhập."); return; }
    setLoading(true);
    setError(null);
    setScore(null);
    try {
      const payload: any = {};
      if (mode === "template" && templateId) payload.templateId = templateId;
      if (mode === "set" && questionSetId) payload.questionSetId = questionSetId;
      const res = await fetch("/api/quiz/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Start failed");
      setAttemptId(j.data.attemptId);
      setItems(j.data.items || []);
      if (j.data.timeLimit) setTimeLeft(j.data.timeLimit);
      setAnswers({});
    } catch (e: any) {
  // timer countdown
  useEffect(() => {
    if (!timeLeft || !attemptId) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null) return t;
        if (t <= 1) {
          clearInterval(id);
          submit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, attemptId]);
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function setAnswer(questionId: string, choiceIdx: number, multi: boolean) {
    setAnswers((prev) => {
      const cur = prev[questionId] || [];
      if (multi) {
        const has = cur.includes(choiceIdx);
        return { ...prev, [questionId]: has ? cur.filter((x) => x !== choiceIdx) : [...cur, choiceIdx] };
      } else {
        return { ...prev, [questionId]: [choiceIdx] };
      }
    });
  }

  async function submit() {
    if (!attemptId) return;
    setLoading(true);
    setError(null);
    try {
      const responses = Object.entries(answers).map(([qid, arr]) => ({ questionId: qid, answer: arr }));
      const res = await fetch("/api/quiz/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attemptId, responses }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Submit failed");
      setScore({ score: j.data.score, total: j.data.total, details: j.data.details });
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Quiz Practice</h1>

      {!attemptId && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded bg-purple-600 text-white" onClick={start} disabled={loading}>
              Luyện theo đề xuất
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-sm"><input type="radio" checked={mode === "template"} onChange={() => setMode("template")} /> Theo Template</label>
            <label className="flex items-center gap-1 text-sm"><input type="radio" checked={mode === "set"} onChange={() => setMode("set")} /> Theo Question Set</label>
          </div>

          {mode === "template" ? (
            <div>
              <label className="block text-sm">Chọn Template</label>
              <select className="border p-2 rounded min-w-64" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                <option value="">-- chọn --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm">Chọn Question Set</label>
              <select className="border p-2 rounded min-w-64" value={questionSetId} onChange={(e) => setQuestionSetId(e.target.value)}>
                <option value="">-- chọn --</option>
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={start} disabled={loading || (!templateId && !questionSetId)}>Bắt đầu</button>
        </div>
      )}

      {error && <div className="text-red-600">{error}</div>}

      {attemptId && (
        <div className="space-y-4">
          {timeLeft !== null && (
            <div className="text-right text-sm text-gray-600">Thời gian còn lại: {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</div>
          )}
          {items.map((it, idx) => (
            <div key={it.questionId} className="border rounded p-3">
              <div className="font-medium mb-2">{idx + 1}. {it.stem}</div>
              <div className="space-y-2">
                {it.options?.map((op, i) => (
                  <label key={i} className="flex items-center gap-2">
                    {it.type === "multiple_choice" ? (
                      <input type="checkbox" checked={!!(answers[it.questionId]?.includes(i))} onChange={() => setAnswer(it.questionId, i, true)} />
                    ) : (
                      <input type="radio" name={it.questionId} checked={!!(answers[it.questionId]?.includes(i))} onChange={() => setAnswer(it.questionId, i, false)} />
                    )}
                    <span>{op.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <button className="px-3 py-2 rounded border" onClick={() => { setAttemptId(null); setItems([]); setAnswers({}); setScore(null); }}>Làm lại</button>
            <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={submit} disabled={loading}>Nộp bài</button>
          </div>

          {score && (
            <div className="space-y-2">
              <div className="text-green-700">Điểm: {score.score} / {score.total}</div>
              <div className="border rounded p-3">
                <div className="font-medium mb-2">Review</div>
                <ul className="list-disc ml-5">
                  {score.details?.map((d, i) => (
                    <li key={i} className={d.isRight ? 'text-green-700' : 'text-red-700'}>
                      Q{i+1}: {d.isRight ? 'Đúng' : `Sai (đúng: [${d.correctIdx.join(',')}], chọn: [${d.givenIdx.join(',')}])`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


