"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Search, Clock, User, Briefcase, TrendingUp, Eye, Trash2, Award, MessageSquare } from "lucide-react";

interface Interview {
  id: string;
  userId: string;
  jobRoleId: string;
  jobRole: {
    key: string;
    title: string;
    level: string;
    category?: {
      name: string;
    } | null;
    specialization?: {
      name: string;
    } | null;
  };
  language: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: string;
  progress: number;
  questionCount: number;
  coveredTopics: string[];
  conversationHistory?: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  evaluation?: {
    overallRating: number;
    technicalScore: number;
    communicationScore: number;
    problemSolvingScore: number;
    recommendations?: string[];
  };
  skillAssessment?: Record<string, number>;
}

// Dialog UI: dùng tạm <div> thay cho Dialog/ScrollArea nếu chưa có
interface InterviewDetailDialogProps {
  interview: Interview | null;
  isOpen: boolean;
  onClose: () => void;
}

function InterviewDetailDialog({ interview, isOpen, onClose }: InterviewDetailDialogProps) {
  if (!interview || !isOpen) return null;

  // Data mapping
  const candidateName = interview.userId || "Candidate";
  const position = interview.jobRole?.title || "No position title";
  const date = new Date(interview.startTime).toLocaleString();
  const status = interview.status;
  const summary = interview.evaluation?.recommendations?.join(', ') || "";
  const notes = ""; // If there's a notes field, get it, otherwise leave empty
  const conversationHistory = interview.conversationHistory?.map(msg => ({
    speaker: msg.role === 'user' ? 'You' : 'AI',
    text: msg.content
  })) || [];
  const skillScores = interview.skillAssessment || {};

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Completed":
      case "completed":
        return "default";
      case "Pending":
      case "pending":
        return "secondary";
      case "Cancelled":
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleOverlayClick}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-[800px] w-full max-h-[90vh] flex flex-col relative border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Interview Session Details</h2>
            <p className="text-gray-600 mt-1">Detailed information about this interview session</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        
        <div className="overflow-y-auto flex-grow p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Candidate</p>
                  <p className="text-sm text-blue-700">{candidateName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                <Briefcase className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-900">Position</p>
                  <p className="text-sm text-purple-700">{position}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Date</p>
                  <p className="text-sm text-green-700">{date}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-900">Status</p>
                  <Badge variant={getStatusVariant(status)} className="mt-1">{status}</Badge>
                </div>
              </div>
              
              {summary && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm font-medium text-gray-900 mb-2">Summary</p>
                  <p className="text-sm text-gray-700">{summary}</p>
                </div>
              )}
              
              {notes && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm font-medium text-gray-900 mb-2">Notes</p>
                  <p className="text-sm text-gray-700">{notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Conversation History */}
          {conversationHistory.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Conversation History</h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
                {conversationHistory.map((msg, index) => (
                  <div key={index} className={`flex gap-3 ${msg.speaker === 'Bạn' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.speaker === 'Bạn' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium opacity-80">
                          {msg.speaker === 'You' ? 'You' : 'AI Interviewer'}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill Assessment */}
          {skillScores && Object.keys(skillScores).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-gray-900">Skill Assessment</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(skillScores).map(([skill, score]) => (
                  <div key={skill} className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <span className="font-medium text-amber-900">{skill}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-amber-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(score / 10) * 100}%` }}
                        ></div>
                      </div>
                      <Badge variant="outline" className="bg-white/80 text-amber-700 border-amber-300">
                        {score}/10
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InterviewHistoryPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const confirmRef = useRef<HTMLDialogElement>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const pageSize = 10;

  const fetchInterviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/interviews');
      const data = await res.json();
      setInterviews(data.interviews || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInterviews(); }, []);

  const handleViewDetail = (id: string) => {
    const interview = interviews.find(i => i.id === id);
    setSelectedInterview(interview || null);
    setShowDetailDialog(true);
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    confirmRef.current?.showModal();
  };
  
  const confirmDelete = async () => {
    if (deleteId) {
      setIsDeleting(true);
      confirmRef.current?.close();
      setDeleteId(null);
      const start = Date.now();
      await fetch(`/api/interviews/${deleteId}`, { method: 'DELETE' });
      setInterviews(prev => prev.filter(i => i.id !== deleteId));
      const elapsed = Date.now() - start;
      const minDelay = 800;
      if (elapsed < minDelay) {
        await new Promise(res => setTimeout(res, minDelay - elapsed));
      }
      setIsDeleting(false);
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 2000);
    }
  };
  
  const cancelDelete = () => {
    setDeleteId(null);
    confirmRef.current?.close();
  };

  const filteredInterviews = useMemo(() => {
    if (!searchTerm) return interviews;
    const lower = searchTerm.toLowerCase();
    return interviews.filter(i =>
      (i.jobRole?.title?.toLowerCase() || '').includes(lower) ||
      (i.jobRole?.category?.name?.toLowerCase() || '').includes(lower) ||
      (i.jobRole?.specialization?.name?.toLowerCase() || '').includes(lower)
    );
  }, [searchTerm, interviews]);

  const paginatedInterviews = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredInterviews.slice(start, start + pageSize);
  }, [filteredInterviews, page]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
      case "completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "Pending":
      case "pending":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "Cancelled":
      case "cancelled":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full px-0">
        {/* Loading overlay when deleting */}
        {isDeleting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl px-8 py-8 flex flex-col items-center shadow-2xl border border-gray-100">
              <div className="relative mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-t-blue-400 animate-ping opacity-30"></div>
              </div>
              <span className="text-blue-600 font-medium text-lg">Deleting interview session...</span>
            </div>
          </div>
        )}
        
        {/* Success toast */}
        {deleteSuccess && (
          <div className="fixed top-6 right-6 z-[100] bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in border border-green-400">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium">Deleted successfully!</span>
          </div>
        )}
        
        <Card className="w-full border-0 shadow-lg">
          <CardHeader className="sticky top-0 bg-white z-10 pb-6 border-b border-gray-100">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-gray-900">Interview History</CardTitle>
                  <CardDescription className="text-lg text-gray-600 mt-1">
                    Manage and view details of completed interview sessions
                  </CardDescription>
                </div>
              </div>
              
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by position..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                  className="pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                  aria-label="Search interview sessions"
                />
              </div>
            </div>
          </CardHeader>
           
          <CardContent className="p-6">
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                    <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-t-blue-400 animate-ping opacity-30"></div>
                  </div>
                </div>
              ) : paginatedInterviews.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No interview sessions found</h3>
                  <p className="text-gray-600">Try changing your search terms or start a new interview session</p>
                </div>
              ) : (
                paginatedInterviews.map(i => (
                  <Card
                    key={i.id}
                    className="group hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 rounded-2xl overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                              <Briefcase className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                                {i.jobRole?.title || 'No position title'}
                              </h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Briefcase className="h-4 w-4" />
                                  {i.jobRole?.category?.name || i.jobRole?.specialization?.name || 'No position'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {new Date(i.startTime).toLocaleDateString('en-US')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="h-4 w-4" />
                                  {i.jobRole?.level || 'No level'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  {i.questionCount} questions
                                </span>
                                {i.evaluation?.overallRating && (
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4" />
                                    Score: <span className="font-bold text-amber-600">{i.evaluation.overallRating}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <Badge 
                            variant="outline" 
                            className={`px-4 py-2 rounded-full border-2 font-medium ${getStatusColor(i.status)}`}
                          >
                            {i.status}
                          </Badge>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewDetail(i.id)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                            >
                              <Eye className="h-4 w-4" />
                              Details
                            </Button>
                            
                            {i.evaluation && (
                              <Button 
                                variant="default" 
                                size="sm" 
                                onClick={() => window.location.href = `/avatar-interview/evaluation?id=${i.id}`}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                              >
                                <Award className="h-4 w-4" />
                                Evaluation
                              </Button>
                            )}
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDelete(i.id)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
            
            {/* Load more button if there's more data */}
            {filteredInterviews.length > page * pageSize && (
              <div className="flex justify-center mt-8">
                <Button 
                  onClick={() => setPage(page + 1)} 
                  variant="outline"
                  className="px-8 py-3 rounded-xl border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                >
                  Load more ({filteredInterviews.length - page * pageSize} sessions remaining)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Delete confirmation modal and detail modal remain unchanged */}
        <InterviewDetailDialog
          interview={selectedInterview}
          isOpen={!!selectedInterview && showDetailDialog}
          onClose={() => { setShowDetailDialog(false); setSelectedInterview(null); }}
        />
        
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="rounded-2xl bg-white p-0 w-96 max-w-full shadow-2xl border border-gray-100">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <HighlightOffIcon className="!w-6 !h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Confirm Delete</h3>
                    <p className="text-gray-600 text-sm">Are you sure you want to delete this interview session?</p>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={cancelDelete}
                    className="px-6 py-2 rounded-xl border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={confirmDelete}
                    className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 