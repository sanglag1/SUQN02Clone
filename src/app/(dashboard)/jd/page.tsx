"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { getAIResponse } from '../../../services/azureAiservicesforJD';
import { questionSetService } from '@/services/questionSetService';

import UploadSection from '@/components/JobDescription/UploadSection';
import QuestionsDisplay from '@/components/JobDescription/QuestionsDisplay';
import FeatureHighlights from '@/components/JobDescription/FeatureHighlights';
import SavedQuestionSets from '@/components/JobDescription/SavedQuestionSets';
import ValidationInfoDisplay from '@/components/JobDescription/ValidationInfoDisplay';
import Toast from '@/components/ui/Toast';
import type { QuestionSetData } from '@/services/questionSetService';
import { AlertTriangle, Eye, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type MinimalQuestionSet = {
  id?: string | null;
  originalJDText: string;
  questions: string[];
};

const UploadJDPageContent = () => {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | ''>(''); 
  const [dragActive, setDragActive] = useState<boolean>(false);  const [questions, setQuestions] = useState<string[]>([]);
  const [questionType, setQuestionType] = useState<'technical' | 'behavioral' | ''>('');
  const [level, setLevel] = useState<'junior' | 'mid' | 'senior'>('junior');
  const [currentQuestionSetId, setCurrentQuestionSetId] = useState<string | null>(null);
  
  // Validation state
  const [validationInfo, setValidationInfo] = useState<{
    isValidJD: boolean;
    confidence: number;
    message: string;
    detectedSections?: string[];
    suggestions?: string[];
    missingCriticalSections?: string[];
  } | null>(null);
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Key for localStorage
  const STORAGE_KEY = 'jd_page_state';

  const [duplicateJDInfo, setDuplicateJDInfo] = useState<{
    isDuplicate: boolean;
    existingSet?: MinimalQuestionSet;
    similarity?: number;
  } | null>(null);
  const [showDuplicateOptions, setShowDuplicateOptions] = useState(false);

  // Toast helper function
  const showToastMessage = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const getAllQuestionsFromJD = async (jdText: string): Promise<string[]> => {
    try {
      // Lấy tất cả question sets của user
      const response = await fetch('/api/jd/question-sets');
      if (response.ok) {
        const questionSets = await response.json() as MinimalQuestionSet[];
        
        // Tìm tất cả question sets có JD tương tự
        const similarSets = questionSets.filter((set) => {
          const similarity = calculateSimilarity(jdText, set.originalJDText);
          return similarity > 0.7; // Ngưỡng 70% similarity
        });
        
        // Trả về tất cả câu hỏi từ các sets tương tự
        return similarSets.flatMap((set) => set.questions);
      }
    } catch (error) {
      console.error('Error getting existing questions:', error);
    }
    
    return [];
  };

  // Check JD upload quota before attempting actions
  const checkJdQuota = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/user-package/check-active');
      const json = await res.json();
      if (!res.ok) {
        showToastMessage(json?.error || 'Failed to check your package status', 'error');
        return false;
      }
      const canUse = Boolean(json?.usage?.jdUpload?.canUse);
      if (!canUse) {
        showToastMessage('No remaining JD uploads. Please upgrade your plan.', 'warning');
        return false;
      }
      return true;
    } catch (e) {
      showToastMessage('Failed to verify usage. Please try again.', 'error');
      return false;
    }
  };

  const calculateSimilarity = (text1: string, text2: string): number => {
    const normalize = (text: string) => 
      text.toLowerCase()
         .replace(/[^\w\s]/g, '')
         .replace(/\s+/g, ' ')
         .trim();

    const normalized1 = normalize(text1);
    const normalized2 = normalize(text2);

    const words1 = new Set(normalized1.split(' '));
    const words2 = new Set(normalized2.split(' '));
    
    const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
    const union = new Set(Array.from(words1).concat(Array.from(words2)));
    
    return intersection.size / union.size;
  };

  const handleGenerateWithNewParams = async () => {
    if (!file) {
      showToastMessage('Please select a file first.', 'error');
      return;
    }

    if (file.type !== 'application/pdf') {
      showToastMessage('Only PDF files are supported.', 'error');
      return;
    }

    if (!questionType) {
      showToastMessage('Please select a question type.', 'error');
      return;
    }

    if (!level) {
      showToastMessage('Please select a level.', 'error');
      return;
    }

    // Pre-check JD quota
    const ok = await checkJdQuota();
    if (!ok) return;

    setUploading(true);
    setMessage('Generating interview questions with new parameters...');
    setMessageType('');
    setValidationInfo(null);

    showToastMessage('AI is generating your interview questions...', 'info');

    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            resolve(event.target.result as string);
          } else {
            reject(new Error('Failed to read file content'));
          }
        };
        reader.onerror = (error) => {
          reject(error);
        };
        reader.readAsText(file);
      });

      if (!text.trim()) {
        throw new Error('No text content found in the file');
      }

      // Lấy tất cả câu hỏi đã có từ JD này để tránh trùng lặp
      const allExistingQuestions = await getAllQuestionsFromJD(text);
      
      const aiResponse = await getAIResponse(text, [], {
        questionType: questionType as 'technical' | 'behavioral',
        language: 'en',
        level: level as 'junior' | 'mid' | 'senior',
        avoidDuplicates: allExistingQuestions
      });

      const allLines = aiResponse
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.trim());

      const validQuestions = allLines
        .filter(line => isValidQuestion(line))
        .map((line, index) => {
          const cleanLine = line.replace(/^(\d+\.\s*)?/, '').replace(/^-\s*/, '').trim();
          return `${index + 1}. ${cleanLine}`;
        });

      if (validQuestions.length === 0) {
        throw new Error('No valid interview questions found. Please try with a different job description.');
      }

      setQuestions(validQuestions);
      setMessage(`Successfully generated ${validQuestions.length} interview questions with new parameters!`);
      setMessageType('success');
      showToastMessage(`Successfully generated ${validQuestions.length} interview questions!`, 'success');

      // Tự động lưu question set vào database
      try {
        const jobTitle = questionSetService.extractJobTitle(file.name, text);
        const savedQuestionSet = await questionSetService.saveQuestionSet({
          jobTitle,
          questionType: questionType as 'technical' | 'behavioral',
          level: level as 'junior' | 'mid' | 'senior',
          questions: validQuestions,
          originalJDText: text,
          fileName: file.name
        });
        
        if (savedQuestionSet && savedQuestionSet.id) {
          setCurrentQuestionSetId(savedQuestionSet.id);
        }
        
        setTimeout(() => {
          showToastMessage('Questions saved to your library!', 'info');
        }, 2000);
      } catch (saveError) {
        console.error('Error saving question set:', saveError);
        showToastMessage(' Questions generated but failed to save to library', 'warning');
      }
    } catch (error) {
      console.error('Error generating with new params:', error);
      setMessage(error instanceof Error ? error.message : 'Error generating questions. Please try again.');
      setMessageType('error');
      showToastMessage(`❌ ${error instanceof Error ? error.message : 'Error generating questions. Please try again.'}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Load state from localStorage on component mount
  useEffect(() => {
    try {
      // Check if there's a questionSetId in URL params
      const questionSetId = searchParams.get('questionSetId');
      if (questionSetId) {
        // Load specific question set from database
        loadQuestionSetFromId(questionSetId);
        return;
      }

      // Otherwise, load from localStorage
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const state = JSON.parse(savedState);
        if (state.questions && state.questions.length > 0) {
          setQuestions(state.questions);
          setQuestionType(state.questionType || '');
          setLevel(state.level || 'junior');
          setCurrentQuestionSetId(state.currentQuestionSetId || null);
          setMessage(`Restored ${state.questions.length} questions from previous session`);
          setMessageType('success');
          
          // Clear message after 3 seconds
          setTimeout(() => {
            setMessage('');
            setMessageType('');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  }, [searchParams]);

  // Load question set from database by ID
  const loadQuestionSetFromId = async (questionSetId: string) => {
    try {
      const questionSet = await questionSetService.getQuestionSet(questionSetId);
      setQuestions(questionSet.questions);
      setQuestionType(questionSet.questionType);
      setLevel(questionSet.level);
      setCurrentQuestionSetId(questionSet.id || null);
      setMessage(`Loaded ${questionSet.questions.length} questions from "${questionSet.jobTitle}"`);
      setMessageType('success');
      
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    } catch (error) {
      console.error('Error loading question set:', error);
      setMessage('Failed to load question set');
      setMessageType('error');
    }
  };

  // Save state to localStorage whenever questions change
  useEffect(() => {
    if (questions.length > 0) {
      const state = {
        questions,
        questionType,
        level,
        currentQuestionSetId,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [questions, questionType, level, currentQuestionSetId]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setMessage('');
        setMessageType('');
        setQuestions([]);
        // Show success toast for drag & drop
        showToastMessage(`File "${droppedFile.name}" uploaded successfully!`, 'success');
      }
    }
  };
  const validateFile = (selectedFile: File): boolean => {
    const allowedTypes = ['application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(selectedFile.type)) {
      setMessage('Only PDF files are supported.');
      setMessageType('error');
      showToastMessage(' Only PDF files are supported', 'error');
      return false;
    }

    if (selectedFile.size > maxSize) {
      setMessage('File size must be less than 10MB');
      setMessageType('error');
      showToastMessage('File size must be less than 10MB', 'error');
      return false;
    }

    if (selectedFile.size < 100) {
      setMessage('PDF file appears to be corrupted or empty');
      setMessageType('error');
      showToastMessage('PDF file appears to be corrupted or empty', 'error');
      return false;
    }

    return true;
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setMessage('');
      setMessageType('');
      setQuestions([]);
      // Show success toast for file selection
      showToastMessage(`File "${selectedFile.name}" selected successfully!`, 'success');
    }
  };// Function to check if a line is a real question
  const isValidQuestion = (line: string): boolean => {
    const trimmedLine = line.trim();
    
    // Remove numbering and leading dashes
    const cleanLine = trimmedLine.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim();
    
    // Skip empty lines or very short lines
    if (cleanLine.length < 15) return false;
    
    // Common headers/categories to exclude (case insensitive)
    const excludePatterns = [
      /^(kiến thức|knowledge|experience|skills|competencies|abilities)/i,
      /^(technical|kỹ thuật|behavioral|hành vi|soft skills|hard skills)/i,
      /^(về|about|regarding|concerning)/i,
      /^(programming|lập trình|development|phát triển)/i,
      /^(framework|database|cơ sở dữ liệu|tools|công cụ)/i,
      /^(leadership|quản lý|management|teamwork|làm việc nhóm)/i
    ];
    
    // Check if it matches any exclude pattern
    const isExcluded = excludePatterns.some(pattern => pattern.test(cleanLine));
    if (isExcluded) return false;
    
    // Must contain question indicators
    const questionIndicators = [
      '?', 'như thế nào', 'tại sao', 'khi nào', 'ở đâu', 'ai là', 'gì là', 'sao lại', 
      'làm sao', 'bằng cách nào', 'có thể', 'hãy', 'mô tả', 'giải thích',
      'trình bày', 'what', 'how', 'why', 'when', 'where', 'who', 'which',
      'describe', 'explain', 'tell me', 'can you', 'do you', 'have you',
      'share', 'discuss', 'provide', 'give', 'show', 'demonstrate'
    ];
    
    const hasQuestionIndicator = questionIndicators.some(indicator => 
      cleanLine.toLowerCase().includes(indicator.toLowerCase())
    );
    
    // Additional patterns that indicate questions
    const questionPatterns = [
      /\?$/,  // Ends with question mark
      /^(how|what|why|when|where|who|which|can|do|have|are|is)/i,  // Starts with question words
      /^(hãy|mô tả|giải thích|trình bày|cho biết)/i,  // Vietnamese question starters
      /(experience|kinh nghiệm).*\?/i,  // Experience questions
      /(handle|xử lý).*\?/i,  // Handling questions
    ];
    
    const matchesQuestionPattern = questionPatterns.some(pattern => pattern.test(cleanLine));
    
    return hasQuestionIndicator || matchesQuestionPattern;
  };
  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file to upload.');
      setMessageType('error');
      showToastMessage(' Please select a file first', 'error');
      return;
    }

    if (file.type !== 'application/pdf') {
      setMessage('Only PDF files are supported.');
      setMessageType('error');
      showToastMessage('❌ Only PDF files are supported', 'error');
      return;
    }

    if (!questionType) {
      setMessage('Please select a question type.');
      setMessageType('error');
      showToastMessage('❓ Please select a question type', 'error');
      return;
    }    setUploading(true);
    setMessage('Processing file...');
    setMessageType('');
    setValidationInfo(null); // Clear previous validation

    // Pre-check JD quota
    const ok = await checkJdQuota();
    if (!ok) return;

    // Show processing toast
    showToastMessage('Processing your job description...', 'info');    try {
      // Create FormData and append file
      const formData = new FormData();
      formData.append('file', file);

      const processResponse = await fetch('/api/jd/process-pdf', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: file, // Send file directly as binary
      });      // Handle streaming timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 25 seconds')), 25000);
      });

      // Race between response and timeout
      const responseText = await Promise.race([
        processResponse.text(),
        timeoutPromise
      ]) as string;

      // Parse response once and handle both success and error cases
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse JSON response:', responseText);
        throw new Error('Server returned invalid response. Please try again.');
      }

      if (!processResponse.ok) {
        // Handle validation errors specifically
        if (processResponse.status === 422 && responseData.validation) {
          setValidationInfo(responseData.validation);
          setMessage('Invalid Job Description');
          setMessageType('error');
          showToastMessage('❌ Document is not a valid Job Description', 'error');
          return;
        }
        
        throw new Error(responseData.error || 'Failed to process file.');
      }

      // Show validation success
      if (responseData.validation?.isValidJD) {
        setValidationInfo(responseData.validation);
        showToastMessage(`✅ Valid Job Description (${responseData.validation.confidence}% confidence)`, 'success');
      }

      const { questions: extractedTextArr } = responseData;
      const text = extractedTextArr?.[0] || '';

      if (!text.trim()) {
        throw new Error('No text content found in the file');
      }

      setMessage('Generating interview questions...');
      
      // Show AI generation toast
      showToastMessage('AI is generating your interview questions...', 'info');

      // Gọi API với thông tin đầy đủ
      const response = await fetch('/api/jd/process-pdf', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          text,
          questionType,
          level,
          userId: user?.id
        })
      });

      const result = await response.json();

      if (result.success === false && result.error === 'Duplicate JD detected') {
        // Xử lý JD trùng lặp
        setDuplicateJDInfo({
          isDuplicate: true,
          existingSet: result.existingQuestionSet,
          similarity: result.similarity
        });
        
        setMessage('Duplicate JD detected. You can view existing questions or generate new ones.');
        setMessageType('warning');
        showToastMessage('⚠️ Duplicate JD detected!', 'warning');
        return;
      }

      const aiResponse = await getAIResponse(text, [], {
        questionType: questionType,
        language: 'en',
        level: level
      });

      // Filter and process only valid questions
      const allLines = aiResponse
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.trim());

      // Filter out headers and keep only real questions
      const validQuestions = allLines
        .filter(line => isValidQuestion(line))
        .map((line, index) => {
          // Clean up the line and add numbering
          const cleanLine = line.replace(/^(\d+\.\s*)?/, '').replace(/^-\s*/, '').trim();
          return `${index + 1}. ${cleanLine}`;
        });

      if (validQuestions.length === 0) {
        throw new Error('No valid interview questions found. Please try with a different job description.');
      }      setQuestions(validQuestions);
      setMessage(`Successfully generated ${validQuestions.length} interview questions!`);
      setMessageType('success');

      // Show success toast
      showToastMessage(`Successfully generated ${validQuestions.length} interview questions!`, 'success');

      // Consume 1 JD upload credit
      try {
        const consumeRes = await fetch('/api/user-package/consume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resource: 'jd' })
        });
        const consumeJson = await consumeRes.json();
        if (!consumeRes.ok) {
          // If no remaining usage, inform user but keep generated result
          showToastMessage(consumeJson?.error || 'No remaining JD uploads. Please upgrade your plan.', 'warning');
        } else {
          showToastMessage(`JD upload recorded. Remaining: ${consumeJson.remaining}`, 'info');
        }
      } catch (e) {
        // Silent fail, but log to console for debugging
        console.error('Failed to consume JD usage', e);
      }

      // Tự động lưu question set vào database
      try {
        const jobTitle = questionSetService.extractJobTitle(file.name, text);
        const savedQuestionSet = await questionSetService.saveQuestionSet({
          jobTitle,
          questionType: questionType as 'technical' | 'behavioral',
          level,
          questions: validQuestions,
          originalJDText: text,
          fileName: file.name
        });
        
        // Update current question set ID with the newly saved set
        if (savedQuestionSet && savedQuestionSet.id) {
          setCurrentQuestionSetId(savedQuestionSet.id);
         
        }
        
        // Show save success toast after a delay
        setTimeout(() => {
          showToastMessage('Questions saved to your library!', 'info');
        }, 2000);
      } catch (saveError) {
        console.error('Error saving question set:', saveError);
        showToastMessage(' Questions generated but failed to save to library', 'warning');
      }    } catch (error) {
      console.error('Error processing file:', error);
      setMessage(error instanceof Error ? error.message : 'Error processing file. Please try again.');
      setMessageType('error');
      showToastMessage(`❌ ${error instanceof Error ? error.message : 'Error processing file. Please try again.'}`, 'error');
    } finally {
      setUploading(false);
    }
  };  const handleQuestionSetSelect = (questionSet: QuestionSetData) => {
    setQuestions(questionSet.questions);
    setQuestionType(questionSet.questionType);
    setLevel(questionSet.level);
    setCurrentQuestionSetId(questionSet.id || null);
    setMessage(`Loaded ${questionSet.questions.length} questions from "${questionSet.jobTitle}"`);
    setMessageType('success');
    
    // Show toast for loading saved question set
    showToastMessage(`Loaded ${questionSet.questions.length} questions from "${questionSet.jobTitle}"`, 'success');
    
    // Clear sau 3 giây
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);

    // Scroll to questions section
    setTimeout(() => {
      const questionsSection = document.getElementById('questions-section');
      if (questionsSection) {
        questionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  const removeFile = () => {
    setFile(null);
    setMessage('');
    setMessageType('');
    setQuestions([]);
    setCurrentQuestionSetId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Clear localStorage when removing file
    localStorage.removeItem(STORAGE_KEY);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const copyQuestions = () => {
    const questionsText = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    navigator.clipboard.writeText(questionsText);
    setMessage('Questions copied to clipboard!');
    setMessageType('success');
    
    // Show toast for copy action
    showToastMessage('Questions copied to clipboard!', 'success');
    
    setTimeout(() => {
      setMessage('');
    }, 2000);
  };  const downloadQuestions = () => {
    const questionsText = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    const blob = new Blob([questionsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interview-questions.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show toast for download action
    showToastMessage('Questions downloaded successfully!', 'success');
  };  const clearCurrentSession = () => {
    setQuestions([]);
    setQuestionType('');
    setLevel('junior');
    setCurrentQuestionSetId(null);
    setMessage('');
    setMessageType('');
    setValidationInfo(null); // Clear validation info
    localStorage.removeItem(STORAGE_KEY);
    
    // Show toast for clear action
    showToastMessage('Current session cleared!', 'info');
  };

  // Handle retry for validation
  const handleRetry = () => {
    setFile(null);
    setValidationInfo(null);
    setMessage('');
    setMessageType('');
    setQuestions([]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    showToastMessage('Ready to upload a new file', 'info');
  };
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Job Description</h1>
              <p className="text-gray-600 text-lg">Upload your job description file and we&apos;ll generate tailored interview questions for you.</p>
            </div>
            <Link 
              href="/jd-interview-history"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View History
            </Link>
          </div>
        </div>        {/* Upload Section */}
        <div className="mb-12">
          <UploadSection 
            file={file}
            setFile={setFile}
            uploading={uploading}
            message={message}
            messageType={messageType}
            dragActive={dragActive}
            fileInputRef={fileInputRef}
            handleDrag={handleDrag}
            handleDrop={handleDrop}
            handleFileChange={handleFileChange}
            handleButtonClick={handleButtonClick}
            removeFile={removeFile}
            formatFileSize={formatFileSize}
            questionType={questionType}
            setQuestionType={(type) => setQuestionType(type as 'technical' | 'behavioral' | '')}
            level={level}
            setLevel={(selectedLevel) => setLevel(selectedLevel as 'junior' | 'mid' | 'senior')}
            handleUpload={handleUpload}
          />
        </div>

        {/* Validation Info Display */}
        {validationInfo && (
          <div className="mb-12">
            <ValidationInfoDisplay 
              validation={validationInfo}
              onRetry={handleRetry}
            />
          </div>
        )}        {/* Saved Question Sets Section */}
        <div className="mb-12">
          <SavedQuestionSets 
            onQuestionSetSelect={handleQuestionSetSelect} 
            onShowToast={showToastMessage}
          />
        </div>{/* Questions Display Section - Made larger and more prominent */}
        {questions.length > 0 && (
          <div id="questions-section" className="mb-12">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Generated Interview Questions</h2>
                <p className="text-gray-600">Click on any question below to start practicing your answers</p>
              </div><QuestionsDisplay 
                questions={questions}
                copyQuestions={copyQuestions}
                downloadQuestions={downloadQuestions}
                clearSession={clearCurrentSession}
                currentQuestionSetId={currentQuestionSetId}
              />
            </div>
          </div>
                  )}

          {/* Duplicate JD Warning */}
          {duplicateJDInfo?.isDuplicate && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-800">
                    Similar Job Description Detected
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    This JD is {duplicateJDInfo.similarity}% similar to one you&apos;ve already processed.
                  </p>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!duplicateJDInfo?.existingSet) return;
                          // Hiển thị câu hỏi đã có
                          setQuestions(duplicateJDInfo.existingSet.questions);
                          setCurrentQuestionSetId(duplicateJDInfo.existingSet.id ?? null);
                          setDuplicateJDInfo(null);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Existing Questions ({duplicateJDInfo.existingSet?.questions.length ?? 0})
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Tạo câu hỏi mới với parameters khác
                          setShowDuplicateOptions(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Generate Different Questions
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDuplicateJDInfo(null)}
                      className="text-yellow-600 hover:text-yellow-700"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <FeatureHighlights />
        </div>

      {/* Toast Notifications */}
      <Toast 
        message={toastMessage}
        type={toastType}
        show={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Duplicate Options Modal */}
      {showDuplicateOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Generate Different Questions</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDuplicateOptions(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Choose different parameters to generate unique questions from this JD.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Question Type</label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as 'technical' | 'behavioral')}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as 'junior' | 'mid' | 'senior')}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="junior">Junior</option>
                  <option value="mid">Mid-level</option>
                  <option value="senior">Senior</option>
                </select>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowDuplicateOptions(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowDuplicateOptions(false);
                    setDuplicateJDInfo(null);
                    // Generate với parameters mới
                    handleGenerateWithNewParams();
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Generate
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

// Main page component with Suspense boundary
const UploadJDPage = () => {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    }>
      <UploadJDPageContent />
    </Suspense>
  );
};

export default UploadJDPage;
