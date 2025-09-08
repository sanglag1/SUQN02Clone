import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const field = searchParams.get('field');

    if (!field) {
      // Nếu không có field parameter, trả về tất cả fields có sẵn
      const questions = await prisma.question.findMany({ 
        select: { fields: true } 
      });
      
      const allFields = questions.flatMap(q => q.fields || []);
      const uniqueFields = Array.from(new Set(allFields)).sort();
      
      return NextResponse.json({
        type: 'fields',
        data: uniqueFields
      });
    } else {
      // Nếu có field parameter, trả về topics của field đó
      const questions = await prisma.question.findMany({
        where: {
          fields: {
            has: field
          }
        },
        select: { topics: true }
      });

      const allTopics = questions.flatMap(q => q.topics || []);
      const uniqueTopics = Array.from(new Set(allTopics)).sort();

      return NextResponse.json({
        type: 'topics',
        field: field,
        data: uniqueTopics
      });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
