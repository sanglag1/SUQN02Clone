# AI Interview Flow with HeyGen Integration

## Overview
Hệ thống phỏng vấn AI tích hợp với HeyGen Avatar để tạo ra trải nghiệm phỏng vấn tương tác thời gian thực với AI interviewer có hình ảnh và giọng nói tự nhiên.

## Architecture Components

### 1. **Core Hooks & Services**
- `useAvatarInterviewSession` - Main orchestrator
- `useAIConversation` - AI conversation management
- `useAvatarControl` - HeyGen avatar control
- `useConversation` - Message handling
- `Avatar-AI.ts` - AI interview logic
- `evaluationService.ts` - Interview evaluation

### 2. **External Integrations**
- **HeyGen API** - Avatar streaming & voice synthesis
- **OpenAI API** - AI conversation & evaluation
- **Question Bank API** - Context-aware questions
- **Clerk Auth** - User authentication

## Detailed Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INTERVIEW SESSION FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

1. SESSION INITIALIZATION
   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
   │   User Setup    │───▶│  PreInterview   │───▶│  Avatar Config  │
   │   (Job Role,    │    │     Setup       │    │   (HeyGen)      │
   │    Language)    │    │                 │    │                 │
   └─────────────────┘    └─────────────────┘    └─────────────────┘
           │                        │                        │
           ▼                        ▼                        ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                    useAvatarInterviewSession                    │
   │  • Initialize HeyGen token                                     │
   │  • Setup avatar configuration                                  │
   │  • Prepare AI context                                          │
   └─────────────────────────────────────────────────────────────────┘

2. AVATAR CONNECTION
   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
   │  Fetch Token    │───▶│  Init Avatar    │───▶│  Start Session  │
   │  (/api/heygen-  │    │  (Streaming-    │    │  (Avatar ready) │
   │   token)        │    │   Avatar)       │    │                 │
   └─────────────────┘    └─────────────────┘    └─────────────────┘

3. AI INTERVIEW START
   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
   │  Question Bank  │───▶│  AI Context     │───▶│  Start Interview│
   │  Context API    │    │  Preparation    │    │  (Avatar-AI)    │
   │                 │    │                 │    │                 │
   └─────────────────┘    └─────────────────┘    └─────────────────┘
           │                        │                        │
           ▼                        ▼                        ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                      useAIConversation                          │
   │  • Generate initial greeting                                   │
   │  • Setup conversation history                                  │
   │  • Initialize interview state                                  │
   └─────────────────────────────────────────────────────────────────┘

4. CONVERSATION LOOP
   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
   │  User Input     │───▶│  AI Processing  │───▶│  Avatar Output  │
   │  (Voice/Text)   │    │  (OpenAI)       │    │  (HeyGen)       │
   └─────────────────┘    └─────────────────┘    └─────────────────┘
           │                        │                        │
           ▼                        ▼                        ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                    CONVERSATION CYCLE                           │
   │                                                                 │
   │  User Response ──▶ processInterviewResponse ──▶ Avatar Speak   │
   │       │                    │                        │          │
   │       ▼                    ▼                        ▼          │
   │  Voice/Text ──▶ AI Analysis ──▶ Question/Feedback ──▶ Display  │
   │                                                                 │
   └─────────────────────────────────────────────────────────────────┘

5. AUTO-PROMPT SYSTEM
   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
   │  Timer Start    │───▶│  Check Silence  │───▶│  Generate Prompt│
   │  (30s delay)    │    │  (User inactive)│    │  (AI reminder)  │
   └─────────────────┘    └─────────────────┘    └─────────────────┘
           │                        │                        │
           ▼                        ▼                        ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                    AUTO-PROMPT LOGIC                            │
   │  • Track user activity                                          │
   │  • Generate contextual reminders                                │
   │  • Max 3 prompts before ending                                  │
   └─────────────────────────────────────────────────────────────────┘

6. INTERVIEW COMPLETION
   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
   │  Question Count │───▶│  Final Response │───▶│  End Interview  │
   │  (10 questions) │    │  (User answer)  │    │  (Conclusion)   │
   └─────────────────┘    └─────────────────┘    └─────────────────┘
           │                        │                        │
           ▼                        ▼                        ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                    EVALUATION PROCESS                           │
   │  • Generate comprehensive evaluation                            │
   │  • Save interview data                                          │
   │  • Redirect to results page                                     │
   └─────────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

### 1. **Session Initialization**
```typescript
// useAvatarInterviewSession
const initializeSession = async () => {
  // 1. Validate job role selection
  if (!jobRoleId) return;
  
  // 2. Setup HeyGen avatar
  await startSession(config);
  
  // 3. Prepare AI context with question bank
  const questionBankConfig = {
    field: jobRole.category.name,
    level: jobRole.level,
    language: mapUILanguageToAI(config.language),
    jobRoleTitle: jobRole.title,
    jobRoleLevel: jobRole.level
  };
  
  // 4. Start AI interview
  await aiStartNewInterview(field, level, language, questionBankConfig);
};
```

### 2. **Avatar Control Flow**
```typescript
// useAvatarControl
const startSession = async (config: StartAvatarRequest) => {
  // 1. Get HeyGen access token
  const token = await fetchAccessToken();
  
  // 2. Initialize StreamingAvatar
  const avatar = new StreamingAvatar({ token });
  
  // 3. Setup event handlers
  avatar.on(StreamingEvents.STREAM_READY, handleStreamReady);
  avatar.on(StreamingEvents.AVATAR_START_TALKING, handleAvatarTalking);
  avatar.on(StreamingEvents.USER_TALKING_MESSAGE, handleUserInput);
  
  // 4. Start avatar session
  await avatar.start(config);
};
```

### 3. **AI Conversation Flow**
```typescript
// useAIConversation
const processMessage = async (userMessage: string) => {
  // 1. Add user message to history
  setConversationHistory(prev => [...prev, { role: 'user', content: userMessage }]);
  
  // 2. Process with AI
  const response = await processInterviewResponse(
    userMessage,
    conversationHistory,
    language,
    config
  );
  
  // 3. Update interview state
  setInterviewState(prev => ({
    ...prev,
    progress: response.interviewProgress,
    coveredTopics: response.completionDetails.coveredTopics,
    skillAssessment: response.completionDetails.skillAssessment
  }));
  
  // 4. Send to avatar
  await onAnswer(response.answer);
};
```

### 4. **Question Bank Integration**
```typescript
// Avatar-AI.ts
async function getQuestionBankContext(config: InterviewConfig) {
  const response = await fetch('/api/questions/interview-context', {
    method: 'POST',
    body: JSON.stringify({
      field: config.field,
      level: config.level,
      jobRoleTitle: config.jobRoleTitle,
      jobRoleLevel: config.jobRoleLevel,
      questionCount: FIXED_QUESTIONS
    })
  });
  
  return response.json();
}
```

## Data Flow Architecture

### 1. **State Management**
```typescript
// Global State Structure
interface InterviewSessionState {
  // Avatar State
  sessionState: SessionState;
  isAvatarTalking: boolean;
  connectionQuality: string;
  
  // AI State
  isThinking: boolean;
  conversationHistory: ChatMessage[];
  questionCount: number;
  
  // Interview State
  interviewProgress: number;
  coveredTopics: string[];
  skillAssessment: {
    technical: number;
    communication: number;
    problemSolving: number;
  };
  
  // Auto-prompt State
  autoPromptCount: number;
  isAutoPromptActive: boolean;
}
```

### 2. **Message Flow**
```
User Input (Voice/Text)
    ↓
useConversation (Message handling)
    ↓
useAIConversation (AI processing)
    ↓
Avatar-AI.ts (Interview logic)
    ↓
OpenAI API (AI response)
    ↓
useAvatarControl (Avatar output)
    ↓
HeyGen API (Voice synthesis)
    ↓
Avatar Display (Visual output)
```

### 3. **Evaluation Flow**
```
Interview Complete
    ↓
generateInterviewEvaluation()
    ↓
Question Analysis (per Q&A pair)
    ↓
Overall Assessment
    ↓
Skill Scoring
    ↓
Recommendations
    ↓
Save to Database
    ↓
Redirect to Results
```

## Key Features

### 1. **Multi-Language Support**
- 5 languages: Vietnamese, English, Chinese, Japanese, Korean
- Dynamic language mapping (UI → AI format)
- Localized prompts and responses

### 2. **Context-Aware Questions**
- Question bank integration
- Role-specific question selection
- Level-appropriate difficulty
- Progressive question flow

### 3. **Real-time Interaction**
- Voice-to-text transcription
- Text-to-speech synthesis
- Avatar lip-sync
- Interruption handling

### 4. **Auto-Prompt System**
- 30-second inactivity timer
- Contextual reminders
- Maximum 3 prompts
- Graceful session ending

### 5. **Comprehensive Evaluation**
- Technical skill assessment
- Communication evaluation
- Problem-solving analysis
- Detailed feedback
- Hiring recommendations

## Error Handling

### 1. **Connection Issues**
- Automatic reconnection
- Quality degradation handling
- Fallback to text-only mode

### 2. **AI Service Failures**
- Retry mechanisms
- Fallback responses
- Graceful degradation

### 3. **User Experience**
- Loading states
- Error messages
- Recovery options

## Performance Optimizations

### 1. **Streaming Optimization**
- Efficient video streaming
- Audio compression
- Bandwidth management

### 2. **AI Response Optimization**
- Response caching
- Context window management
- Token usage optimization

### 3. **Memory Management**
- Conversation history cleanup
- Event handler cleanup
- Resource disposal

## Security Considerations

### 1. **Authentication**
- Clerk integration
- Token-based access
- Session management

### 2. **Data Privacy**
- Encrypted communication
- Secure storage
- GDPR compliance

### 3. **API Security**
- Rate limiting
- Input validation
- Error sanitization



