import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all job categories
export async function GET() {
  try {
    const categories = await prisma.jobCategory.findMany({
      include: {
        jobRoles: true,
        specializations: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching job categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job categories' },
      { status: 500 }
    );
  }
}

// POST - Create a new job category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const category = await prisma.jobCategory.create({
      data: { name },
      include: {
        jobRoles: true,
        specializations: true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating job category:', error);
    return NextResponse.json(
      { error: 'Failed to create job category' },
      { status: 500 }
    );
  }
}


