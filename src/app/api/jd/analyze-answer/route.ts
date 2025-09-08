import { NextRequest, NextResponse } from 'next/server';
import { getAIResponse } from '../../../../services/azureAiservicesforJD';

export async function POST(req: NextRequest) {
  try {
    const { question, answer, type } = await req.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    // Tạo prompt để AI phân tích câu trả lời với scoring chi tiết
    const analysisPrompt = `
Analyze this interview answer and provide detailed feedback with comprehensive scoring:

QUESTION: ${question}
ANSWER: ${answer}
QUESTION TYPE: ${type}

Please provide feedback in the following JSON format:

{
  "feedback": "Detailed written feedback with strengths, areas for improvement, and suggestions",
  "detailedScores": {
    "content": number (1-10, độ phong phú, chính xác và chất lượng nội dung),
    "relevance": number (1-10, độ liên quan và phù hợp với câu hỏi),
    "clarity": number (1-10, độ rõ ràng, logic và dễ hiểu),
    "overall": number (1-10, điểm tổng thể)
  },
  "strengths": [
    "Specific strength 1",
    "Specific strength 2"
  ],
  "improvements": [
    "Specific improvement 1", 
    "Specific improvement 2"
  ],
  "suggestions": [
    "Actionable suggestion 1",
    "Actionable suggestion 2"
  ],
  "level": "basic" | "intermediate" | "advanced",
  "recommendedNextLevel": "basic" | "intermediate" | "advanced",
  "readinessScore": number (0-100, % sẵn sàng cho level tiếp theo)
}

Ensure all scores are realistic and based on the actual quality of the answer. Be specific and constructive in feedback.
    `;

    const response = await getAIResponse(analysisPrompt, ['analysis']);
    
    // Parse JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(response);
    } catch (error) {
      console.warn("Failed to parse AI response as JSON:", error);
      // Fallback if AI doesn't return valid JSON
      analysisResult = {
        feedback: response,
        detailedScores: {
          content: 6,
          relevance: 6,
          clarity: 6,
          overall: 6
        },
        strengths: ["Good effort in answering"],
        improvements: ["Could provide more detail"],
        suggestions: ["Practice with more specific examples"],
        level: "intermediate",
        recommendedNextLevel: "intermediate", 
        readinessScore: 60
      };
    }

    return NextResponse.json({ 
      ...analysisResult,
      success: true 
    });

  } catch (error) {
    console.error('Error analyzing answer:', error);
    return NextResponse.json(
      { error: 'Failed to analyze answer. Please try again.' },
      { status: 500 }
    );
  }
}