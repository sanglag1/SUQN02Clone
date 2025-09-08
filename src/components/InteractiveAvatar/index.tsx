import React from 'react';
import VideoPlayer from './subcomponents/VideoPlayer';
import ChatControls from './subcomponents/ChatControls';
import PreInterviewSetup from './subcomponents/PreInterviewSetup';
import InterviewResult from './subcomponents/InterviewResult';
import { AVATARS, STT_LANGUAGE_LIST, SessionState } from './HeygenConfig';
import { useAvatarInterviewSession, Interview } from './hooks/useAvatarInterviewSession';

const transformedLanguageList = STT_LANGUAGE_LIST;

interface InteractiveAvatarProps {
  onEndSession?: (data?: Interview) => void;
}

const InteractiveAvatar: React.FC<InteractiveAvatarProps> = ({ onEndSession }) => {
  const [interviewResult, setInterviewResult] = React.useState<Interview | null>(null);

  // UI callback when interview result is received
  const handleEndSessionUI = (data: Interview) => {
    console.log('handleEndSessionUI called with data:', data);
    setInterviewResult(data);
    // Call onEndSession from parent component if provided
    if (onEndSession) {
      onEndSession(data);
    }
  };

  // Handler to navigate to evaluation page
  const handleViewEvaluation = () => {
    if (interviewResult?.id) {
      window.location.href = `/avatar-interview/evaluation?id=${interviewResult.id}`;
    }
  };

  const handleBackToInterview = () => {
    setInterviewResult(null);
    // Optionally reset other states if needed
  };

  // Handler for VideoPlayer onStopSession (no-arg)
  const handleStopSession = async () => {
    // Reset UI or state when user manually stops session
    setInterviewResult(null);
    resetAutoPrompt(); // Reset auto-prompt when stopping session
    await handleEndSession(); // Properly clean up Heygen/avatar session
    if (onEndSession) {
      onEndSession();
    }
  };

  // Enhanced handlers that reset auto-prompt
  const handleSendMessageWithReset = async () => {
    resetAutoPrompt(); // Reset auto-prompt when user sends message
    await handleSendMessage();
  };

  const handleSpeechResultWithReset = (text: string) => {
    resetAutoPrompt(); // Reset auto-prompt when user speaks
    handleSpeechResult(text);
  };

  const {
    config, setConfig,
    connectionQuality,
    jobRoles,
    isAvatarTalking,
    message, setMessage,
    isInterviewComplete,
    isSubmitting,
    elapsedTime,
    formatElapsedTime,
    sessionState,
    videoRef,
    initializeSession,
    handleSendMessage,
    handleSpeechResult,
    conversation,
    isThinking,
    interviewState,
    questionCount,
    handleInterruptAvatar,
    isInterrupting,
    setPositionKey,
    setJobRoleId,
    isSavingInterview,
    isInitializingInterview,

    resetAutoPrompt,
    handleEndSession
  } = useAvatarInterviewSession({ onEndSession: handleEndSessionUI });

  return (
    <>
      <div className="relative w-full h-full">
        {(isSavingInterview || isInitializingInterview) && (
          <div
            className="absolute inset-0 z-[9999] flex items-center justify-center flex-col bg-white/70"
          >
            <svg className="animate-spin mb-4" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="20" stroke="#3B82F6" strokeWidth="4" opacity="0.2" />
              <path d="M44 24c0-11.046-8.954-20-20-20" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <div className="text-xl text-blue-600 font-medium">
              {isSavingInterview
                ? 'Saving interview results...'
                : 'Preparing interview...'}
            </div>
          </div>
        )}
        {interviewResult ? (
          <InterviewResult
            interview={interviewResult}
            onBack={handleBackToInterview}
            onViewEvaluation={handleViewEvaluation}
          />
        ) : sessionState === SessionState.INACTIVE ? (
          <PreInterviewSetup
            config={config}
            onConfigChange={setConfig}
            onStartInterview={initializeSession}
            sessionState={sessionState}
            AVATARS={AVATARS}
            STT_LANGUAGE_LIST={transformedLanguageList}
            onJobRoleIdChange={setJobRoleId}
            onPositionKeyChange={setPositionKey}
            jobRoles={jobRoles}
          />
        ) : (
          <div className="flex flex-col lg:flex-row h-screen bg-gray-50 overflow-hidden">
            {/* Video Player - Left side (Mobile: above chat, Desktop: left sidebar) */}
            <div className="lg:flex-1 flex flex-col min-w-0 order-1">
              <div className="lg:flex-1 flex flex-col lg:min-h-0">
                <VideoPlayer
                  videoRef={videoRef}
                  connectionQuality={connectionQuality}
                  sessionState={sessionState}
                  avatarId={config.avatarName}
                  avatarName={AVATARS.find(a => a.avatar_id === config.avatarName)?.name || ''}
                  SessionState={SessionState}
                  onStopSession={handleStopSession}
                  onInterruptAvatar={handleInterruptAvatar}
                  isAvatarTalking={isAvatarTalking}
                  isInterrupting={isInterrupting}
                  elapsedTime={formatElapsedTime(elapsedTime)}
                  onSpeechResult={handleSpeechResultWithReset}
                  voiceDisabled={sessionState !== SessionState.CONNECTED || isInterviewComplete || isSubmitting}
                  voiceLanguage={config.language === 'en' ? 'en-US' : 'vi-VN'}
                />
              </div>
            </div>

            {/* Chat Controls - Right side (Mobile: below video, Desktop: right sidebar) */}
            <div className="lg:hidden flex-shrink-0 order-2 w-full">
              <ChatControls
                sessionState={sessionState}
                inputText={message}
                setInputText={setMessage}
                isAvatarTalking={isAvatarTalking}
                conversation={conversation}
                onSendMessage={handleSendMessageWithReset}
                isThinking={isThinking}
                isInterviewComplete={isInterviewComplete}
                questionCount={questionCount}
                skillAssessment={interviewState.skillAssessment}
                coveredTopics={interviewState.coveredTopics}
                progress={interviewState.progress || 0}
              />
            </div>

            {/* Chat Controls - Desktop: Right sidebar */}
            <div className="hidden lg:block flex-shrink-0 order-2">
              <ChatControls
                sessionState={sessionState}
                inputText={message}
                setInputText={setMessage}
                isAvatarTalking={isAvatarTalking}
                conversation={conversation}
                onSendMessage={handleSendMessageWithReset}
                isThinking={isThinking}
                isInterviewComplete={isInterviewComplete}
                questionCount={questionCount}
                skillAssessment={interviewState.skillAssessment}
                coveredTopics={interviewState.coveredTopics}
                progress={interviewState.progress || 0}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InteractiveAvatar;
