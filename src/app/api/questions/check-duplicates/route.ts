import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Advanced text similarity function
function calculateSimilarity(str1: string, str2: string): number {
  const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  const text1 = normalize(str1);
  const text2 = normalize(str2);
  
  if (text1 === text2) return 1;
  
  // Exact substring check for high similarity
  if (text1.includes(text2) || text2.includes(text1)) {
    const shorter = text1.length < text2.length ? text1 : text2;
    const longer = text1.length >= text2.length ? text1 : text2;
    return shorter.length / longer.length;
  }
  
  // Word-based similarity with higher precision
  const words1 = text1.split(' ').filter(w => w.length > 2); // Filter out short words
  const words2 = text2.split(' ').filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const allWords = Array.from(new Set([...words1, ...words2]));
  let matches = 0;
  let weightedMatches = 0;
  
  for (const word of allWords) {
    if (words1.includes(word) && words2.includes(word)) {
      matches++;
      // Give more weight to longer words
      weightedMatches += Math.max(1, word.length / 4);
    }
  }
  
  // Combined score considering both word matches and weighted importance
  const wordSimilarity = matches / allWords.length;
  const weightedSimilarity = weightedMatches / (allWords.length * 2);
  
  return Math.max(wordSimilarity, weightedSimilarity);
}

export async function POST(request: NextRequest) {
  try {
    const { questions } = await request.json();
    
    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Questions array is required' },
        { status: 400 }
      );
    }

    // Get existing questions from database
    // Search broadly first, then filter by similarity
    const existingQuestions = await prisma.question.findMany({
      select: {
        id: true,
        question: true,
        fields: true,
        topics: true
      }
    });

    // Check each question for duplicates
    const results = questions.map((questionText: string, index: number) => {
      const similarQuestions = existingQuestions
        .map(existingQ => ({
          id: existingQ.id,
          question: existingQ.question,
          similarity: calculateSimilarity(questionText, existingQ.question)
        }))
        .filter(result => result.similarity > 0.5) // Lower threshold for better detection
        .sort((a, b) => b.similarity - a.similarity) // Sort by highest similarity first
        .slice(0, 5); // Limit to top 5 similar questions

      return {
        questionIndex: index,
        isDuplicate: similarQuestions.length > 0,
        similarQuestions
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to check duplicates' },
      { status: 500 }
    );
  }
}
