import React from 'react';
import { Cloud, File, FileText, Upload, X } from 'lucide-react';

interface FileUploadAreaProps {
  file: File | null;
  dragActive: boolean;
  handleDrag: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  handleButtonClick: () => void;
  removeFile: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  formatFileSize: (size: number) => string;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  file,
  dragActive,
  handleDrag,
  handleDrop,
  handleButtonClick,
  removeFile,
  fileInputRef,
  handleFileChange,
  formatFileSize,
}) => {
  return (
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
          <div className="flex justify-center">
            <Cloud className="w-12 h-12 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Drop your file here, or browse
            </h3>
            <p className="text-gray-500 mb-4 text-sm">
              Supports PDF, DOC, DOCX, TXT files up to 10MB
            </p>
            <button
              type="button"
              onClick={handleButtonClick}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center">
            <File className="w-12 h-12 text-green-500" />
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </div>
          <p className="text-green-600 font-medium text-sm">File ready to process!</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
      />
    </div>
  );
};

export default FileUploadArea;
