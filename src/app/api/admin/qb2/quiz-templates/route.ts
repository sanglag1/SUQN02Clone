import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = prisma as any;

type ListQuery = {
  page?: string;
  pageSize?: string;
  questionSetId?: string;
  isActive?: string;
  search?: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q: ListQuery = Object.fromEntries(searchParams.entries());
  const page = Math.max(parseInt(q.page || "1", 10), 1);
  const pageSize = Math.min(Math.max(parseInt(q.pageSize || "20", 10), 1), 100);

  const where: any = {};
  if (q.questionSetId) where.questionSetId = q.questionSetId;
  if (q.isActive !== undefined) where.isActive = q.isActive === "true";
  if (q.search) where.name = { contains: q.search, mode: "insensitive" };

  const [items, total] = await Promise.all([
    db.quizTemplate.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { questionSet: true },
    }),
    db.quizTemplate.count({ where }),
  ]);

  return NextResponse.json({ data: items, page, pageSize, total });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { questionSetId, name, description, timeLimit, shuffle = true, sectionRules, scoringPolicy, retakePolicy, isActive = true, createdById } = body || {};

  if (!questionSetId || !name) return NextResponse.json({ error: "questionSetId and name are required" }, { status: 400 });

  const created = await db.quizTemplate.create({
    data: {
      questionSetId,
      name,
      description: description || null,
      timeLimit: timeLimit ?? null,
      shuffle,
      sectionRules: sectionRules || null,
      scoringPolicy: scoringPolicy || null,
      retakePolicy: retakePolicy || null,
      isActive,
      createdById: createdById || null,
    },
    include: { questionSet: true },
  });

  return NextResponse.json({ data: created }, { status: 201 });
}


