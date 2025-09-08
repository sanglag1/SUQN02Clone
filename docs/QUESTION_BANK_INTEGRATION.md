# Question Bank Integration với Avatar-AI

## Tổng quan

Hệ thống Avatar-AI hiện tại đã được tích hợp với Question Bank để AI có thể sử dụng câu hỏi có sẵn thay vì tự tạo câu hỏi. Điều này giúp:

1. **Tính nhất quán**: Câu hỏi phù hợp với level và field cụ thể
2. **Chất lượng cao**: Sử dụng câu hỏi đã được review và validate
3. **Kiểm soát tốt hơn**: Admin có thể quản lý và cập nhật question bank
4. **Tiết kiệm thời gian**: Không cần AI tạo câu hỏi từ đầu

## Cách hoạt động

### 1. Flow tích hợp

```
User starts interview → Avatar-AI calls question bank API → 
Gets relevant questions + context → AI uses questions as reference →
Conducts interview using question bank content
```

### 2. API Integration

Avatar-AI gọi API `/api/questions/interview-context` để lấy:

- **Questions**: Danh sách câu hỏi phù hợp với job role
- **Context Prompt**: Hướng dẫn cho AI về cách sử dụng questions
- **Job Role Mapping**: Thông tin mapping giữa job role và question bank

### 3. AI Context Enhancement

AI nhận được system message được enhance với:

```typescript
// System message cơ bản
"You are a senior technical interviewer conducting a professional interview..."

// + Question bank context
"QUESTION BANK REFERENCE:
Use these questions as inspiration for your interview:

Question: What is React?
Options: A. A JavaScript library, B. A programming language
Correct Answer(s): A
Explanation: React is a JavaScript library for building user interfaces

IMPORTANT: You can:
1. Ask these questions directly
2. Use them as inspiration to create similar questions
3. Adapt them based on the candidate's responses
4. Ask follow-up questions based on these topics"
```

## Cách sử dụng

### 1. Trong Avatar-AI Service

```typescript
// Cấu hình interview với job role mapping
const config: InterviewConfig = {
  field: 'Frontend',
  level: 'Junior',
  language: 'en-US',
  jobRoleTitle: 'Frontend Developer', // Quan trọng để mapping
  jobRoleLevel: 'Junior'              // Quan trọng để mapping
};

// AI sẽ tự động lấy question bank context
const response = await processInterviewResponse(
  userMessage, 
  conversationHistory, 
  language, 
  config // Truyền config để có job role mapping
);
```

### 2. Trong useAvatarInterviewSession

```typescript
const {
  // ... other hooks
} = useAIConversation({
  // ... other props
  config: {
    field: selectedJobRole?.category?.name || 'software development',
    level: selectedJobRole?.level || 'mid',
    language: config.language === 'vi' ? 'vi-VN' : 'en-US',
    jobRoleTitle: selectedJobRole?.title,      // Quan trọng
    jobRoleLevel: selectedJobRole?.level       // Quan trọng
  }
});
```

### 3. Trong InteractiveAvatar Component

```typescript
// Component tự động truyền config từ job role selection
<InteractiveAvatar 
  onEndSession={handleEndSession}
  // Config được truyền tự động từ job role selection
/>
```

## Cấu trúc dữ liệu

### InterviewConfig Interface

```typescript
export interface InterviewConfig {
  field: string;                    // Field chính (Frontend, Backend, etc.)
  level: string;                    // Level (Junior, Mid, Senior)
  language: 'vi-VN' | 'en-US';     // Ngôn ngữ phỏng vấn
  specialization?: string;          // Chuyên môn cụ thể
  minExperience?: number;           // Kinh nghiệm tối thiểu
  maxExperience?: number;           // Kinh nghiệm tối đa
  jobRoleTitle?: string;            // Tên job role (Frontend Developer)
  jobRoleLevel?: string;            // Level job role (Junior)
}
```

### Question Bank Response

```typescript
{
  questions: Array<{
    id: string;
    question: string;
    answers: Array<{ content: string; isCorrect: boolean }>;
    fields: string[];
    topics: string[];
    levels: string[];
    explanation?: string;
  }>;
  contextPrompt: string;            // AI context với question bank
  usedQuestionIds: string[];        // IDs của questions được sử dụng
  jobRoleMapping: {                 // Mapping với job role
    jobRoleKey: string;
    jobRoleTitle: string;
    jobRoleLevel: string;
    categoryName: string;
    skills: string[];
    interviewFocusAreas: string[];
  }
}
```

## Lợi ích

### 1. Cho AI Interviewer

- **Câu hỏi chất lượng**: Sử dụng câu hỏi đã được validate
- **Tính nhất quán**: Đảm bảo câu hỏi phù hợp với level và field
- **Tiết kiệm thời gian**: Không cần tạo câu hỏi từ đầu
- **Linh hoạt**: Có thể adapt và tạo follow-up questions

### 2. Cho Admin

- **Kiểm soát nội dung**: Quản lý question bank tập trung
- **Cập nhật dễ dàng**: Thêm/sửa/xóa questions
- **Phân tích hiệu quả**: Theo dõi questions nào được sử dụng nhiều
- **Chất lượng**: Review và approve questions trước khi sử dụng

### 3. Cho User

- **Trải nghiệm nhất quán**: Câu hỏi phù hợp với level
- **Chất lượng cao**: Questions được review và validate
- **Phù hợp với job role**: Questions specific cho vị trí ứng tuyển

## Fallback Behavior

Nếu question bank API không hoạt động:

1. **AI vẫn hoạt động**: Sử dụng system message cơ bản
2. **Tự tạo câu hỏi**: AI fallback về chế độ tự tạo câu hỏi
3. **Logging**: Ghi log lỗi để debug
4. **User experience**: Không ảnh hưởng đến trải nghiệm người dùng

## Testing

### Unit Tests

```bash
npm run test:unit questionBankIntegration.test.ts
```

### Integration Tests

```bash
npm run test:integration Avatar-AI.test.ts
```

### Manual Testing

1. Start interview với job role cụ thể
2. Kiểm tra console logs để xem question bank context
3. Verify AI sử dụng questions từ question bank
4. Test fallback khi API không hoạt động

## Troubleshooting

### Common Issues

1. **Question bank context không load**
   - Kiểm tra jobRoleTitle và jobRoleLevel có được truyền đúng không
   - Verify API `/api/questions/interview-context` hoạt động
   - Check network requests trong browser dev tools

2. **AI không sử dụng question bank**
   - Kiểm tra config có được truyền vào processInterviewResponse không
   - Verify questionBankContext có được load thành công không
   - Check system message có chứa question bank context không

3. **Fallback không hoạt động**
   - Kiểm tra error handling trong getQuestionBankContext
   - Verify AI vẫn hoạt động khi không có question bank
   - Check logs để debug

### Debug Steps

1. **Enable logging**:
   ```typescript
   console.log('Question bank context:', questionBankContext);
   console.log('System message:', systemContent);
   ```

2. **Check API response**:
   ```typescript
   const response = await fetch('/api/questions/interview-context', {...});
   console.log('API response:', response);
   ```

3. **Verify config**:
   ```typescript
   console.log('Interview config:', config);
   console.log('Job role mapping:', config.jobRoleTitle, config.jobRoleLevel);
   ```

## Future Enhancements

1. **Caching**: Cache question bank context để tăng performance
2. **Dynamic loading**: Load questions theo từng topic khi cần
3. **Personalization**: Adapt questions dựa trên user profile
4. **Analytics**: Track questions usage và effectiveness
5. **A/B Testing**: Test different question sets

