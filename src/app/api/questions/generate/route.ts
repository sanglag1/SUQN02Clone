import { NextResponse } from 'next/server';
import { generateQuizQuestionsByAI } from '@/services/aiQuizGenerator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { field, topic, level, count, language } = body;
    if (!field || !topic || !level || !count) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    const questions = await generateQuizQuestionsByAI({ field, topic, level, count, language });
    // Chuẩn hóa về format giống QuestionManager
    const formatted = questions.map(q => ({
      question: q.question,
      answers: q.options.map((content, i) => ({ content, isCorrect: q.correct.includes(i) })),
      fields: [field],
      topics: [topic],
      levels: [level],
      explanation: q.explanation || ''
    }));
    return NextResponse.json({ data: formatted }, { status: 200 });
  } catch (error) {
    console.error('Error generating questions by AI:', error);
    return NextResponse.json({ error: 'Failed to generate questions by AI' }, { status: 500 });
  }
} 