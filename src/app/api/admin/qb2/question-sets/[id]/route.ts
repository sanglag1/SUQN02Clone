import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = prisma as any;

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const item = await db.questionSet.findUnique({
    where: { id: params.id },
    include: { items: { include: { question: { include: { options: true } } } }, jobRole: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: item });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const body = await req.json();
  const { name, description, jobRoleId, level, topics, fields, status, version } = body || {};

  const exist = await db.questionSet.findUnique({ where: { id: params.id } });
  if (!exist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.questionSet.update({
    where: { id: params.id },
    data: {
      name: name ?? exist.name,
      description: description === undefined ? exist.description : description,
      jobRoleId: jobRoleId === undefined ? exist.jobRoleId : jobRoleId,
      level: level === undefined ? exist.level : level,
      topics: topics ?? exist.topics,
      fields: fields ?? exist.fields,
      status: status ?? exist.status,
      version: version ?? exist.version,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await db.$transaction(async (tx: any) => {
    await tx.questionSetQuestion.deleteMany({ where: { questionSetId: params.id } });
    await tx.questionSet.delete({ where: { id: params.id } });
  });
  return NextResponse.json({ ok: true });
}


