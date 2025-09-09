import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = prisma as any;

type ListQuery = {
  page?: string;
  pageSize?: string;
  jobRoleId?: string;
  level?: string;
  status?: string;
  search?: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q: ListQuery = Object.fromEntries(searchParams.entries());
  const page = Math.max(parseInt(q.page || "1", 10), 1);
  const pageSize = Math.min(Math.max(parseInt(q.pageSize || "20", 10), 1), 100);

  const where: any = {};
  if (q.jobRoleId) where.jobRoleId = q.jobRoleId;
  if (q.level) where.level = q.level;
  if (q.status) where.status = q.status;
  if (q.search) where.name = { contains: q.search, mode: "insensitive" };

  const [items, total] = await Promise.all([
    db.questionSet.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { items: { include: { question: { include: { options: true } } } }, jobRole: true },
    }),
    db.questionSet.count({ where }),
  ]);

  return NextResponse.json({ data: items, page, pageSize, total });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, jobRoleId, level, topics = [], fields = [], status = "draft", version = 1, createdById } = body || {};

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const created = await db.questionSet.create({
    data: {
      name,
      description: description || null,
      jobRoleId: jobRoleId || null,
      level: level || null,
      topics,
      fields,
      status,
      version,
      createdById: createdById || null,
    },
    include: { jobRole: true },
  });

  return NextResponse.json({ data: created }, { status: 201 });
}


