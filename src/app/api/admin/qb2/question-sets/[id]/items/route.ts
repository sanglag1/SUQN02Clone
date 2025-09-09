import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = prisma as any;

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const rows = await db.questionSetQuestion.findMany({
    where: { questionSetId: params.id },
    orderBy: { order: "asc" },
    include: { question: { include: { options: true } } },
  });
  return NextResponse.json({ data: rows });
}

// Replace entire list of items for the set
export async function PUT(req: NextRequest, { params }: Params) {
  const list = await req.json();
  if (!Array.isArray(list)) return NextResponse.json({ error: "Body must be an array" }, { status: 400 });

  const data = list.map((row: any, idx: number) => ({
    questionSetId: params.id,
    questionId: row.questionId,
    order: row.order ?? idx,
    section: row.section || null,
    weight: row.weight ?? 1,
    isRequired: row.isRequired ?? true,
    timeSuggestion: row.timeSuggestion ?? null,
  }));

  await db.$transaction(async (tx: any) => {
    await tx.questionSetQuestion.deleteMany({ where: { questionSetId: params.id } });
    if (data.length) await tx.questionSetQuestion.createMany({ data });
  });

  const rows = await db.questionSetQuestion.findMany({
    where: { questionSetId: params.id },
    orderBy: { order: "asc" },
    include: { question: { include: { options: true } } },
  });
  return NextResponse.json({ data: rows });
}


