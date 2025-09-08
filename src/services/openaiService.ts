// src/services/openaiService.ts

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const AZURE_OPENAI_KEY= process.env.NEXT_PUBLIC_AZURE_OPENAI_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT = process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT || "gpt-4.0";
const AZURE_OPENAI_API_VERSION = "2024-04-01-preview";

export async function callOpenAI(messages: ChatMessage[]) {
  if (!AZURE_OPENAI_KEY || !AZURE_OPENAI_ENDPOINT) {
    console.error('Missing Azure OpenAI configuration:', {
      hasKey: !!AZURE_OPENAI_KEY,
      hasEndpoint: !!AZURE_OPENAI_ENDPOINT,
      deployment: AZURE_OPENAI_DEPLOYMENT
    });
    throw new Error("Azure OpenAI key or endpoint is missing");
  }

  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY,
      },
      body: JSON.stringify({
        messages,
        max_tokens: 1024,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error('Invalid response structure from Azure OpenAI:', data);
      throw new Error('Invalid response structure from Azure OpenAI');
    }

    return data;
  } catch (error) {
    console.error('Error calling Azure OpenAI:', error);
    throw new Error(`Failed to call Azure OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
