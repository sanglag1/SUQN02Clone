import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all job roles with related data
export async function GET() {
  try {
    const jobRoles = await prisma.jobRole.findMany({
      include: {
        category: true,
        specialization: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json(jobRoles);
  } catch (error) {
    console.error('Error fetching job roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job roles' },
      { status: 500 }
    );
  }
}

// POST - Create a new job role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      key,
      title,
      level,
      description,
      minExperience,
      maxExperience,
      categoryId,
      specializationId,
      order = 0,
    } = body;

    // Validate required fields
    if (!key || !title || !level) {
      return NextResponse.json(
        { error: 'Missing required fields: key, title, level' },
        { status: 400 }
      );
    }

    // Check if key already exists
    const existingRole = await prisma.jobRole.findFirst({
      where: { key },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'Job role with this key already exists' },
        { status: 409 }
      );
    }

    const prepared = {
      key,
      title,
      level,
      description,
      minExperience: minExperience || 0,
      maxExperience,
      categoryId,
      specializationId,
      order,
    };

    const jobRole = await prisma.jobRole.create({
      data: prepared,
      include: {
        category: true,
        specialization: true,
      },
    });

    return NextResponse.json(jobRole, { status: 201 });
  } catch (error) {
    console.error('Error creating job role:', error);
    return NextResponse.json(
      { error: 'Failed to create job role' },
      { status: 500 }
    );
  }
}

// PATCH - Update a job role
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      key,
      title,
      level,
      description,
      minExperience,
      maxExperience,
      categoryId,
      specializationId,
      order,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Job role ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (key !== undefined) updateData.key = key;
    if (title !== undefined) updateData.title = title;
    if (level !== undefined) updateData.level = level;
    if (description !== undefined) updateData.description = description;
    if (minExperience !== undefined) updateData.minExperience = minExperience;
    if (maxExperience !== undefined) updateData.maxExperience = maxExperience;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (specializationId !== undefined) updateData.specializationId = specializationId;
    if (order !== undefined) updateData.order = order;

    const jobRole = await prisma.jobRole.update({
      where: { id },
      data: updateData as Record<string, unknown>,
      include: {
        category: true,
        specialization: true,
      },
    });

    return NextResponse.json(jobRole);
  } catch (error) {
    console.error('Error updating job role:', error);
    return NextResponse.json(
      { error: 'Failed to update job role' },
      { status: 500 }
    );
  }
}
