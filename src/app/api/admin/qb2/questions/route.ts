/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// Temporary adapter while client types refresh in editors
const db: any = prisma as any;

type ListQuery = {
  page?: string;
  pageSize?: string;
  type?: string;
  level?: string;
  search?: string;
  topics?: string; // comma separated
  fields?: string; // comma separated
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q: ListQuery = Object.fromEntries(searchParams.entries());

  const page = Math.max(parseInt(q.page || "1", 10), 1);
  const pageSize = Math.min(Math.max(parseInt(q.pageSize || "20", 10), 1), 100);

  const where: any = {};
  if (q.type) where.type = q.type;
  if (q.level) where.level = q.level;
  if (q.search) where.stem = { contains: q.search, mode: "insensitive" };
  if (q.topics) where.topics = { hasSome: q.topics.split(",").map((s) => s.trim()).filter(Boolean) };
  if (q.fields) where.fields = { hasSome: q.fields.split(",").map((s) => s.trim()).filter(Boolean) };
  if ((q as any).skills) where.skills = { hasSome: String((q as any).skills).split(",").map((s) => s.trim()).filter(Boolean) };

  const [items, total] = await Promise.all([
    db.questionItem.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { options: true },
    }),
    db.questionItem.count({ where }),
  ]);

  return NextResponse.json({ data: items, page, pageSize, total });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    type,
    stem,
    explanation,
    level,
    topics = [],
    fields = [],
    skills = [],
    difficulty = null,
    options = [],
    createdById,
  } = body || {};

  if (!type || !stem) {
    return NextResponse.json({ error: "type and stem are required" }, { status: 400 });
  }

  const created = await db.questionItem.create({
    data: {
      type,
      stem,
      explanation: explanation || null,
      level: level || null,
      topics,
      fields,
      skills,
      difficulty: difficulty === null ? null : Number(difficulty),
      createdById: createdById || null,
      options: options?.length
        ? {
            createMany: {
              data: options.map(
                (
                  o: { text: string; isCorrect?: boolean; order?: number; metadata?: unknown },
                  idx: number
                ) => ({
                  text: o.text,
                  isCorrect: !!o.isCorrect,
                  order: o.order ?? idx,
                  metadata: (o.metadata as any) || null,
                })
              ),
            },
          }
        : undefined,
    },
    include: { options: true },
  });

  return NextResponse.json({ data: created }, { status: 201 });
}


