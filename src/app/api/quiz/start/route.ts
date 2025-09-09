import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

type StartBody = {
  templateId?: string;
  questionSetId?: string; // if provided, use defaults
  userId?: string; // optional; prefer server auth
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as StartBody;
  const { templateId, questionSetId } = body || {};
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  // If neither provided, auto-pick by user's preferredJobRoleId + experienceLevel
  let autoQuestionSetId = questionSetId;
  let autoTemplateId = templateId;
  if (!templateId && !questionSetId) {
    const sets = await prisma.questionSet.findMany({
      where: {
        OR: [
          { jobRoleId: user.preferredJobRoleId, level: (user.experienceLevel as any) ?? undefined },
          { jobRoleId: user.preferredJobRoleId },
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
      take: 1,
    });
    autoQuestionSetId = sets[0]?.id;
    if (!autoQuestionSetId) {
      const fallback = await prisma.questionSet.findFirst({ orderBy: { updatedAt: "desc" }, select: { id: true } });
      autoQuestionSetId = fallback?.id || undefined;
    }
    if (!autoQuestionSetId) return NextResponse.json({ error: "No QuestionSet available" }, { status: 404 });
    const tpl = await prisma.quizTemplate.findFirst({ where: { questionSetId: autoQuestionSetId, isActive: true }, select: { id: true } });
    autoTemplateId = tpl?.id || undefined;
  }

  // Resolve question set and config
  let resolvedSetId: string;
  let timeLimit: number | null = null;
  let shuffle = true;
  let sectionRules: Record<string, { take?: number }> | null = null;

  if (autoTemplateId) {
    const tpl = await prisma.quizTemplate.findUnique({ where: { id: autoTemplateId }, include: { questionSet: { include: { items: { include: { question: { include: { options: true } } } } } } } });
    if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    resolvedSetId = tpl.questionSetId;
    timeLimit = tpl.timeLimit ?? null;
    shuffle = !!tpl.shuffle;
    sectionRules = (tpl.sectionRules as any) || null;
  } else {
    const set = await prisma.questionSet.findUnique({ where: { id: (autoQuestionSetId as string) }, include: { items: { include: { question: { include: { options: true } } } } } });
    if (!set) return NextResponse.json({ error: "QuestionSet not found" }, { status: 404 });
    resolvedSetId = set.id;
    timeLimit = 900; // default 15 minutes
    shuffle = true;
    sectionRules = null; // take all by default
  }

  // Pull items from set
  const setWithItems = await prisma.questionSet.findUnique({
    where: { id: resolvedSetId },
    include: { items: { orderBy: { order: "asc" }, include: { question: { include: { options: true } } } } },
  });
  if (!setWithItems) return NextResponse.json({ error: "QuestionSet not found" }, { status: 404 });

  let chosen = setWithItems.items;
  // Apply simple sectionRules if provided: take N by section
  if (sectionRules && Object.keys(sectionRules).length > 0) {
    const bySection: Record<string, typeof chosen> = {};
    for (const it of chosen) {
      const key = it.section || "__none__";
      (bySection[key] ||= []).push(it);
    }
    const picked: typeof chosen = [];
    for (const [sec, cfg] of Object.entries(sectionRules)) {
      const pool = bySection[sec] || [];
      const take = Math.min(cfg?.take ?? pool.length, pool.length);
      picked.push(...pool.slice(0, take));
    }
    // also include sections not specified if rules empty for them
    if (picked.length === 0) picked.push(...chosen);
    chosen = picked;
  }

  // Shuffle if needed
  if (shuffle) {
    chosen = [...chosen].sort(() => Math.random() - 0.5);
  }

  const itemsSnapshot = chosen.map((ci) => ({
    questionId: ci.questionId,
    stem: ci.question.stem,
    type: ci.question.type,
    section: ci.section || null,
    weight: ci.weight,
    options: ci.question.options
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((o) => ({ text: o.text })),
  }));

  const attempt = await prisma.quizAttempt.create({
    data: {
      templateId: autoTemplateId || (await ensureDefaultTemplate(resolvedSetId)).id,
      userId: user.id,
      status: "in_progress",
      itemsSnapshot,
      sectionScores: {},
      timeUsed: 0,
      score: 0,
    },
    select: { id: true, status: true, itemsSnapshot: true, templateId: true },
  });

  return NextResponse.json({ data: { attemptId: attempt.id, timeLimit, items: attempt.itemsSnapshot } });
}

async function ensureDefaultTemplate(questionSetId: string) {
  const exists = await prisma.quizTemplate.findFirst({ where: { questionSetId } });
  if (exists) return exists;
  return prisma.quizTemplate.create({
    data: {
      questionSetId,
      name: "Default Template",
      shuffle: true,
      isActive: true,
    },
  });
}


