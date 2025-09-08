'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestTokenPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testAzureOpenAI = async () => {
    setIsLoading(true);
    setResult('Testing...');
    
    try {
      const response = await fetch('/api/test-azure-openai');
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Success: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testInterviewCompletion = async () => {
    setIsLoading(true);
    setResult('Testing interview completion with 4 questions...');
    
    try {
      // Test với 4 câu hỏi để trigger completion
      const response = await fetch('/api/test-interview-completion');
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Interview completion test: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Interview completion error: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Azure OpenAI Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testAzureOpenAI} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Connection'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Interview Completion Flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testInterviewCompletion} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Interview Completion'}
            </Button>
          </CardContent>
        </Card>
        
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-100 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap">{result}</pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 