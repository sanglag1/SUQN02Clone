import { NextRequest, NextResponse } from 'next/server';
import { processGlobalChatboxMessage } from '@/services/globalChatboxService';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, context = {} } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await processGlobalChatboxMessage(message, context);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in global chatbox API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Global Chatbox API is running' },
    { status: 200 }
  );
}
