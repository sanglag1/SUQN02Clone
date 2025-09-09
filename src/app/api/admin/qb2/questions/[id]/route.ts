import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = prisma as any;

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const item = await db.questionItem.findUnique({ where: { id: params.id }, include: { options: true } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: item });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const body = await req.json();
  const { type, stem, explanation, level, topics, fields, skills, difficulty, options } = body || {};

  const exist = await db.questionItem.findUnique({ where: { id: params.id } });
  if (!exist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.$transaction(async (tx: any) => {
    const base = await tx.questionItem.update({
      where: { id: params.id },
      data: {
        type: type ?? exist.type,
        stem: stem ?? exist.stem,
        explanation: explanation === undefined ? exist.explanation : explanation,
        level: level === undefined ? exist.level : level,
        topics: topics ?? exist.topics,
        fields: fields ?? exist.fields,
        skills: skills ?? exist.skills,
        difficulty: difficulty === undefined ? exist.difficulty : Number(difficulty),
      },
    });

    if (Array.isArray(options)) {
      await tx.questionOption.deleteMany({ where: { questionId: params.id } });
      if (options.length) {
        await tx.questionOption.createMany({
          data: options.map((o: any, idx: number) => ({ questionId: params.id, text: o.text, isCorrect: !!o.isCorrect, order: o.order ?? idx, metadata: o.metadata || null })),
        });
      }
    }

    return tx.questionItem.findUnique({ where: { id: params.id }, include: { options: true } });
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await db.$transaction([
    db.questionOption.deleteMany({ where: { questionId: params.id } }),
    db.questionItem.delete({ where: { id: params.id } }),
  ]);
  return NextResponse.json({ ok: true });
}


