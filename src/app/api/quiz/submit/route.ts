import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type SubmitBody = {
  attemptId: string;
  responses: Array<{ questionId: string; answer: number[] | number | string | null }>;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SubmitBody;
  const { attemptId, responses } = body || {};
  if (!attemptId || !Array.isArray(responses)) return NextResponse.json({ error: "invalid payload" }, { status: 400 });

  const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) return NextResponse.json({ error: "attempt not found" }, { status: 404 });

  // Simple scoring: match selected indices with correct options order
  // We need ground truth from DB (not snapshot) for correctness
  let total = 0;
  let gained = 0;
  const sectionScores: Record<string, { gained: number; total: number }> = {};
  const details: Array<{ questionId: string; correctIdx: number[]; givenIdx: number[]; isRight: boolean }> = [];

  for (const snap of (attempt.itemsSnapshot as any[])) {
    total += (snap.weight ?? 1);
    const sec = snap.section || "__default__";
    sectionScores[sec] ||= { gained: 0, total: 0 };
    sectionScores[sec].total += (snap.weight ?? 1);

    const r = responses.find((x) => x.questionId === snap.questionId);
    if (!r) continue;

    const truth = await prisma.questionItem.findUnique({ where: { id: snap.questionId }, include: { options: true } });
    if (!truth) continue;
    const correctIdx = truth.options
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((o, idx) => ({ idx, isCorrect: o.isCorrect }))
      .filter((x) => x.isCorrect)
      .map((x) => x.idx);

    const given = Array.isArray(r.answer) ? (r.answer as number[]) : typeof r.answer === "number" ? [r.answer] : [];
    const isRight = given.length === correctIdx.length && given.every((g) => correctIdx.includes(g));
    if (isRight) {
      gained += (snap.weight ?? 1);
      sectionScores[sec].gained += (snap.weight ?? 1);
    }
    details.push({ questionId: snap.questionId, correctIdx, givenIdx: given, isRight });
  }

  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      status: "completed",
      completedAt: new Date(),
      responses,
      score: gained,
      sectionScores,
    },
  });

  return NextResponse.json({ data: { score: gained, total, sectionScores, details } });
}


