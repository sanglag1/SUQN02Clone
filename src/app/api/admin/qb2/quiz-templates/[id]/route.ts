import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = prisma as any;

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const item = await db.quizTemplate.findUnique({ where: { id: params.id }, include: { questionSet: true } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: item });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const body = await req.json();
  const { questionSetId, name, description, timeLimit, shuffle, sectionRules, scoringPolicy, retakePolicy, isActive } = body || {};

  const exist = await db.quizTemplate.findUnique({ where: { id: params.id } });
  if (!exist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.quizTemplate.update({
    where: { id: params.id },
    data: {
      questionSetId: questionSetId === undefined ? exist.questionSetId : questionSetId,
      name: name ?? exist.name,
      description: description === undefined ? exist.description : description,
      timeLimit: timeLimit === undefined ? exist.timeLimit : timeLimit,
      shuffle: shuffle === undefined ? exist.shuffle : shuffle,
      sectionRules: sectionRules === undefined ? exist.sectionRules : sectionRules,
      scoringPolicy: scoringPolicy === undefined ? exist.scoringPolicy : scoringPolicy,
      retakePolicy: retakePolicy === undefined ? exist.retakePolicy : retakePolicy,
      isActive: isActive === undefined ? exist.isActive : isActive,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await db.quizTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}


