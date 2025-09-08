'use client';

import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface ValidationInfo {
  isValidJD: boolean;
  confidence: number;
  message: string;
  detectedSections?: string[];
  suggestions?: string[];
  missingCriticalSections?: string[];
}

interface ValidationInfoProps {
  validation: ValidationInfo;
  onRetry: () => void;
}

export function ValidationInfoDisplay({ validation, onRetry }: ValidationInfoProps) {
  if (validation.isValidJD) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-800">Valid Job Description</span>
          <span className="text-green-600 text-sm">({validation.confidence}% confidence)</span>
        </div>
        
        {validation.detectedSections && validation.detectedSections.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-green-700 font-medium mb-2">Detected JD sections:</p>
            <div className="flex flex-wrap gap-1">
              {validation.detectedSections.slice(0, 6).map((section, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md border border-green-200"
                >
                  {section}
                </span>
              ))}
              {validation.detectedSections.length > 6 && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md border border-green-200">
                  +{validation.detectedSections.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border border-red-200 bg-red-50 rounded-lg p-4 mb-4">
      <div className="flex items-center space-x-2 mb-3">
        <XCircle className="h-5 w-5 text-red-600" />
        <span className="font-medium text-red-800">Invalid Job Description</span>
        <span className="text-red-600 text-sm">({validation.confidence}% confidence)</span>
      </div>
      
      <div className="mb-4">
        <div className="bg-red-100 border border-red-200 rounded-md p-3 mb-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-medium mb-1">Why this was rejected:</p>
              <p className="whitespace-pre-line">{validation.message}</p>
            </div>
          </div>
        </div>

        {validation.suggestions && validation.suggestions.length > 0 && (
          <div className="mb-4">
            <p className="font-medium text-red-800 mb-2 text-sm">💡 What should a Job Description include:</p>
            <ul className="space-y-1">
              {validation.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-red-700 flex items-start space-x-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {validation.missingCriticalSections && validation.missingCriticalSections.length > 0 && (
          <div className="mb-4">
            <p className="font-medium text-red-800 mb-2 text-sm">🔍 Missing typical JD sections:</p>
            <div className="flex flex-wrap gap-1">
              {validation.missingCriticalSections.map((section, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md border border-red-200"
                >
                  {section}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Upload Different File
        </button>
      </div>
    </div>
  );
}

export default ValidationInfoDisplay;
