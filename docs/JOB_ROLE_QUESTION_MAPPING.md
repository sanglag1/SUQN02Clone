# Job Role - Question Bank Mapping System

## 🎯 Tổng quan

Hệ thống mapping giữa JobRole và Question Bank đã được cải tiến để đảm bảo AI có thể tạo câu hỏi phỏng vấn chính xác và phù hợp với từng vị trí công việc.

## 🔗 Cấu trúc Mapping

### 1. JobRole Mapping (`src/services/jobRoleQuestionMapping.ts`)

Mỗi job role có mapping chi tiết bao gồm:

```typescript
interface JobRoleMapping {
  jobRoleId: string;
  jobRoleKey: string;
  jobRoleTitle: string;
  jobRoleLevel: string;
  categoryName: string;
  specializationName?: string;
  skills: string[];
  questionFields: string[];
  questionTopics: string[];
  questionLevels: string[];
  aiContextKeywords: string[];
  interviewFocusAreas: string[];
}
```

### 2. Question Bank Mapping

```typescript
interface QuestionBankMapping {
  field: string;
  topics: string[];
  levels: string[];
  skills: string[];
  jobRoles: string[];
}
```

## 📊 Mapping Chi tiết

### Frontend Development

| Level | Skills | Question Fields | Question Topics | AI Keywords |
|-------|--------|-----------------|-----------------|-------------|
| Junior | HTML, CSS, JavaScript, React, Git | Frontend Development, Web Development | HTML/CSS, JavaScript, React, Web Fundamentals | frontend, web development, user interface |
| Mid | React, TypeScript, State Management, Performance | Frontend Development, Web Development | React Advanced, TypeScript, State Management | frontend, react, typescript, performance |
| Senior | Architecture, Leadership, Code Review | Frontend Development, Web Development | Architecture, Leadership, Code Review | frontend architecture, team leadership |

### Backend Development

| Level | Skills | Question Fields | Question Topics | AI Keywords |
|-------|--------|-----------------|-----------------|-------------|
| Junior | Python, Java, Node.js, SQL, Git | Backend Development, Server Development | Programming, Databases, APIs | backend, server, database, api |
| Mid | System Design, Microservices, Caching | Backend Development, Server Development | System Design, Microservices, Caching | system design, microservices, caching |
| Senior | Architecture, Scalability, Security | Backend Development, Server Development | Architecture, Scalability, Security | architecture, scalability, security |

### Full Stack Development

| Level | Skills | Question Fields | Question Topics | AI Keywords |
|-------|--------|-----------------|-----------------|-------------|
| Junior | HTML/CSS, JavaScript, React, Node.js | Full Stack Development, Web Development | Frontend Basics, Backend Basics | full stack, frontend, backend |
| Mid | React, Node.js, TypeScript, Databases | Full Stack Development, Web Development | Frontend Advanced, Backend Advanced | full stack, react, node.js, typescript |
| Senior | Architecture, Leadership, Code Review | Full Stack Development, Web Development | Architecture, Leadership, Code Review | full stack architecture, leadership |

## 🚀 Cách sử dụng

### 1. Tìm Job Role Mapping

```typescript
import { findJobRoleMapping, findJobRoleMappingByTitleAndLevel } from '@/services/jobRoleQuestionMapping';

// Tìm theo key
const mapping = findJobRoleMapping('frontend_developer_junior');

// Tìm theo title và level
const mapping = findJobRoleMappingByTitleAndLevel('Frontend Developer', 'Junior');
```

### 2. Tạo AI Context

```typescript
import { createAIContextForJobRole } from '@/services/jobRoleQuestionMapping';

const aiContext = createAIContextForJobRole(mapping);
```

### 3. Tạo Question Filter

```typescript
import { createQuestionFilterForJobRole } from '@/services/jobRoleQuestionMapping';

const filter = createQuestionFilterForJobRole(mapping);
// Returns: { fields: string[], topics: string[], levels: string[] }
```

## 🔧 API Integration

### Interview Context API (`/api/questions/interview-context`)

API đã được cập nhật để sử dụng mapping mới:

```typescript
// Request
{
  "field": "Frontend",
  "level": "Junior",
  "jobRoleTitle": "Frontend Developer", // Optional
  "jobRoleLevel": "Junior", // Optional
  "questionCount": 4
}

// Response
{
  "questions": [...],
  "contextPrompt": "...",
  "jobRoleMapping": {
    "jobRoleKey": "frontend_developer_junior",
    "jobRoleTitle": "Frontend Developer",
    "jobRoleLevel": "Junior",
    "categoryName": "Frontend",
    "skills": ["HTML", "CSS", "JavaScript", "React"],
    "interviewFocusAreas": [...]
  }
}
```

## 📝 Seeding Data

### 1. Seed Job Roles

```bash
node scripts/seed-job-roles-mapping.js
```

### 2. Seed Question Bank

```bash
node scripts/seed-question-bank.js
```

## 🎯 AI Context Generation

Hệ thống tạo AI context tự động dựa trên job role:

```typescript
// Example AI Context for Frontend Developer - Junior
You are conducting a technical interview for a Junior level Frontend Developer position.

FOCUS AREAS:
- Basic HTML/CSS knowledge
- JavaScript fundamentals
- React basics
- Responsive design
- Git workflow

REQUIRED SKILLS:
- HTML
- CSS
- JavaScript
- React
- Git
- Responsive Design

KEYWORDS TO USE:
frontend, web development, user interface, client-side, browser

INTERVIEW GUIDELINES:
- Ask technical questions related to: HTML/CSS, JavaScript, React, Web Fundamentals, DOM Manipulation
- Focus on Junior level complexity
- Cover areas: Basic HTML/CSS knowledge, JavaScript fundamentals, React basics, Responsive design, Git workflow
- Use natural, professional tone
- Provide constructive feedback
- Adapt questions based on candidate responses
- End with professional conclusion
```

## 🔍 Validation

Sử dụng function validation để kiểm tra mapping:

```typescript
import { validateJobRoleQuestionMapping } from '@/services/jobRoleQuestionMapping';

const validation = validateJobRoleQuestionMapping();
console.log('Valid:', validation.valid);
console.log('Issues:', validation.issues);
```

## 📈 Benefits

### 1. Chính xác hơn
- Mapping 1:1 giữa job role và question bank
- AI context được tạo tự động dựa trên job role
- Skills và focus areas được định nghĩa rõ ràng

### 2. Dễ mở rộng
- Thêm job role mới chỉ cần cập nhật mapping
- Question bank có thể được mở rộng theo từng field
- AI context được tạo động

### 3. Hiệu quả hơn
- Giảm thiểu mapping sai
- AI có context chính xác hơn
- Trải nghiệm phỏng vấn phù hợp hơn

## 🛠️ Maintenance

### Thêm Job Role mới

1. Cập nhật `JOB_ROLE_TO_QUESTION_MAPPING` trong `jobRoleQuestionMapping.ts`
2. Cập nhật `QUESTION_TO_JOB_ROLE_MAPPING` nếu cần
3. Chạy script seed để tạo job role trong database
4. Thêm questions phù hợp vào question bank

### Cập nhật Mapping

1. Chỉnh sửa mapping trong `jobRoleQuestionMapping.ts`
2. Chạy validation để kiểm tra
3. Cập nhật database nếu cần

## 🎯 Kết luận

Hệ thống mapping mới đảm bảo:
- **Chính xác**: Mapping 1:1 giữa job role và question bank
- **Linh hoạt**: Dễ dàng thêm/sửa/xóa mapping
- **Hiệu quả**: AI có context chính xác để tạo câu hỏi phù hợp
- **Mở rộng**: Có thể mở rộng cho nhiều job role khác nhau

