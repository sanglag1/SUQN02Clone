# Language Support Update

## Overview
Hệ thống đã được cập nhật để hỗ trợ đầy đủ 5 ngôn ngữ thay vì chỉ 2 ngôn ngữ như trước đây.

## Supported Languages

### UI Language Codes (from STT_LANGUAGE_LIST)
- `vi` - Vietnamese
- `en` - English  
- `zh` - Chinese
- `ja` - Japanese
- `ko` - Korean

### AI Language Codes (mapped from UI codes)
- `vi-VN` - Vietnamese
- `en-US` - English
- `zh-CN` - Chinese (Simplified)
- `ja-JP` - Japanese
- `ko-KR` - Korean

## Key Changes

### 1. New Utility Function (`src/utils/languageMapping.ts`)
```typescript
// Convert UI language to AI language
mapUILanguageToAI('vi') // Returns 'vi-VN'
mapUILanguageToAI('zh') // Returns 'zh-CN'
mapUILanguageToAI('ja') // Returns 'ja-JP'
mapUILanguageToAI('ko') // Returns 'ko-KR'
mapUILanguageToAI('en') // Returns 'en-US'

// Get display name
getLanguageDisplayName('vi-VN') // Returns 'Vietnamese'
getLanguageDisplayName('zh-CN') // Returns 'Chinese'
```

### 2. Updated Interfaces
- `InterviewConfig.language` now supports all 5 AI language codes
- `processInterviewResponse` language parameter supports all 5 codes
- `generateInterviewEvaluation` language parameter supports all 5 codes

### 3. Enhanced Error Messages
Tất cả error messages và fallback messages đã được dịch sang 5 ngôn ngữ:
- Vietnamese: "Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại."
- Chinese: "抱歉，发生错误。请重试。"
- Japanese: "申し訳ございません。エラーが発生しました。もう一度お試しください。"
- Korean: "죄송합니다. 오류가 발생했습니다. 다시 시도해 주세요."
- English: "Sorry, an error occurred. Please try again."

### 4. Auto-Prompt Support
Auto-prompt messages đã được dịch sang tất cả ngôn ngữ:
- Vietnamese: "Ứng viên chưa trả lời câu hỏi sau..."
- Chinese: "候选人在...秒后仍未回答问题..."
- Japanese: "候補者が...秒後にまだ質問に答えていません..."
- Korean: "후보자가 ...초 후에도 질문에 답하지 않았습니다..."
- English: "The candidate hasn't answered after..."

### 5. Interview Greetings
Greeting messages đã được dịch sang tất cả ngôn ngữ:
- Vietnamese: "Xin chào! Tôi là người phỏng vấn AI..."
- Chinese: "您好！我是您的AI面试官..."
- Japanese: "こんにちは！私は...のAI面接官です..."
- Korean: "안녕하세요! 저는 ... 포지션의 AI 면접관입니다..."
- English: "Hello! I am your AI interviewer..."

## Implementation Details

### Language Mapping Flow
1. User selects language from UI (`vi`, `en`, `zh`, `ja`, `ko`)
2. `mapUILanguageToAI()` converts to AI format (`vi-VN`, `en-US`, `zh-CN`, `ja-JP`, `ko-KR`)
3. AI services receive proper language codes
4. All responses and messages are generated in the selected language

### Files Updated
- `src/utils/languageMapping.ts` - New utility functions
- `src/services/Avatar-AI.ts` - Updated interfaces and language support
- `src/services/evaluationService.ts` - Updated evaluation language support
- `src/components/InteractiveAvatar/hooks/useAvatarInterviewSession.ts` - Updated language mapping
- `src/components/InteractiveAvatar/hooks/useAIConversation.ts` - Updated auto-prompt language support
- `src/components/InteractiveAvatar/subcomponents/PreInterviewSetup.tsx` - Enhanced AI context

## Testing
Để test các ngôn ngữ mới:

### 1. Manual Testing
1. Chọn ngôn ngữ từ dropdown trong PreInterviewSetup
2. Bắt đầu phỏng vấn
3. Kiểm tra AI responses có đúng ngôn ngữ không
4. Kiểm tra error messages và auto-prompts
5. Kiểm tra evaluation results

### 2. Automated Testing
Chạy test file để kiểm tra language mapping:
```bash
# Trong Node.js environment
node -e "require('./src/utils/testLanguageMapping.ts')"
```

### 3. Test Cases
- **Vietnamese (vi-VN)**: Tất cả messages và evaluations phải bằng tiếng Việt
- **Chinese (zh-CN)**: Tất cả messages và evaluations phải bằng tiếng Trung
- **Japanese (ja-JP)**: Tất cả messages và evaluations phải bằng tiếng Nhật
- **Korean (ko-KR)**: Tất cả messages và evaluations phải bằng tiếng Hàn
- **English (en-US)**: Tất cả messages và evaluations phải bằng tiếng Anh

### 4. Verification Points
- ✅ System prompts được tạo đúng ngôn ngữ
- ✅ AI responses bằng đúng ngôn ngữ
- ✅ Error messages bằng đúng ngôn ngữ
- ✅ Auto-prompt messages bằng đúng ngôn ngữ
- ✅ Evaluation feedback bằng đúng ngôn ngữ
- ✅ Fallback messages bằng đúng ngôn ngữ

## Future Enhancements
- Thêm support cho các ngôn ngữ khác (Spanish, French, German, etc.)
- Cải thiện translation quality
- Thêm language-specific interview styles
- Support cho regional variants (zh-TW, en-GB, etc.)
