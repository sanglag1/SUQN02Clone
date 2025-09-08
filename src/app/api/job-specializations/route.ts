import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all job specializations
export async function GET() {
  try {
    const specializations = await prisma.jobSpecialization.findMany({
      include: {
        category: true,
        jobRoles: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(specializations);
  } catch (error) {
    console.error('Error fetching job specializations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job specializations' },
      { status: 500 }
    );
  }
}

// POST - Create a new job specialization
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, categoryId } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        { error: 'Specialization name and category ID are required' },
        { status: 400 }
      );
    }

    const specialization = await prisma.jobSpecialization.create({
      data: {
        name,
        categoryId,
      },
      include: {
        category: true,
        jobRoles: true,
      },
    });

    return NextResponse.json(specialization, { status: 201 });
  } catch (error) {
    console.error('Error creating job specialization:', error);
    return NextResponse.json(
      { error: 'Failed to create job specialization' },
      { status: 500 }
    );
  }
}


