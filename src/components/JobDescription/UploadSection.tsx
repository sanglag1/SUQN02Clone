// components/UploadSection.tsx
import { Cloud, Upload, File, FileText, X } from 'lucide-react';
import MessageAlert from './MessageAlert';
import QuestionTypeSelector from './QuestionTypeSelector';
import LevelSelector from './LevelSelector';

import React from 'react';

type UploadSectionProps = {
  file: File | null;
  setFile: (file: File | null) => void;
  dragActive: boolean;
  handleDrag: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  formatFileSize: (size: number) => string;
  handleButtonClick: () => void;
  handleUpload: () => void;
  uploading: boolean;
  message: string;
  messageType: string;
  removeFile: () => void;
  questionType: string;
  setQuestionType: (type: string) => void;
  level: string;
  setLevel: (level: string) => void;
};

export default function UploadSection({
  file,
  dragActive,
  handleDrag,
  handleDrop,
  handleFileChange,
  fileInputRef,
  formatFileSize,
  handleButtonClick,
  handleUpload,
  uploading,
  message,
  messageType,
  removeFile,
  questionType,
  setQuestionType,
  level,
  setLevel
}: UploadSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6">
        {/* Drag Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            dragActive
              ? 'border-purple-400 bg-purple-50'
              : file
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!file ? (
            <div className="space-y-4">
              <Cloud className="w-12 h-12 text-purple-500 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Drop your file here, or browse</h3>
              <p className="text-gray-500 mb-4 text-sm">Supports PDF files up to 10MB</p>
              <button
                onClick={handleButtonClick}
                type="button"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <File className="w-12 h-12 text-green-500 mx-auto" />
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button onClick={removeFile} className="p-1 hover:bg-gray-100 rounded-full">
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
              </div>
              <p className="text-green-600 font-medium text-sm">File ready to process!</p>
            </div>
          )}          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            className="hidden"
          />
        </div>        <QuestionTypeSelector questionType={questionType} setQuestionType={setQuestionType} />

        <LevelSelector level={level} setLevel={setLevel} />

        {file && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={`inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Generate Interview Questions
                </>
              )}
            </button>
          </div>
        )}

        <MessageAlert
          message={message}
          type={messageType === 'success' ? 'success' : 'error'}
        />
      </div>

      {/* <UploadInfo /> */}
    </div>
  );
}
