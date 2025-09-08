"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class GlobalChatboxErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('GlobalChatbox Error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed bottom-4 right-4 z-50 w-96 h-[600px]">
          <div className="w-full h-full bg-white border-2 border-red-200 rounded-lg shadow-2xl p-6 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Có lỗi xảy ra</h3>
            <p className="text-gray-600 mb-4">AI Assistant gặp sự cố. Vui lòng thử lại hoặc liên hệ support nếu vấn đề tiếp tục.</p>
            <Button onClick={this.handleRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Thử lại
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalChatboxErrorBoundary;


