# Avatar Interview Unit Tests

## Tổng quan

Bộ test này bao phủ toàn bộ chức năng Avatar Interview, bao gồm:

### 1. API Tests (`src/__tests__/api/interviews/`)

#### `heygen-token.test.ts`
- ✅ Lấy token thành công từ Heygen API
- ✅ Xử lý lỗi 401 (API key không hợp lệ)
- ✅ Xử lý lỗi 500 (lỗi server)
- ✅ Cache control headers

#### `interviews.test.ts`
- ✅ Tạo interview thành công
- ✅ Validation jobRoleId bắt buộc
- ✅ Kiểm tra package active
- ✅ Kiểm tra remaining interviews
- ✅ Lấy danh sách interviews của user

#### `interview-evaluation.test.ts`
- ✅ Đánh giá interview thành công
- ✅ Xử lý interview không tồn tại (404)
- ✅ Kiểm tra quyền sở hữu (403)
- ✅ Validation transcripts
- ✅ Xử lý lỗi evaluation service
- ✅ Idempotent với requestId

### 2. Hook Tests (`src/__tests__/components/InteractiveAvatar/hooks/`)

#### `useAvatarControl.test.ts`
- ✅ Khởi tạo state mặc định
- ✅ Lấy Heygen token thành công/lỗi
- ✅ Tạo/kết nối avatar session
- ✅ Toggle microphone/video
- ✅ Phát TTS qua avatar
- ✅ Xử lý hàng đợi speak
- ✅ Kết thúc session và cleanup
- ✅ Xử lý events từ avatar
- ✅ Bảo vệ khi chưa connected
- ✅ Cleanup khi unmount

#### `useAIConversation.test.ts`
- ✅ Khởi tạo conversation
- ✅ Gửi prompt và nhận response
- ✅ Xử lý prompt rỗng/quá dài
- ✅ Xử lý lỗi OpenAI API
- ✅ Xử lý concurrent requests
- ✅ Personalization từ interview preferences
- ✅ Clear conversation history
- ✅ Streaming responses
- ✅ Debounce rapid requests
- ✅ Special characters
- ✅ Conversation context

### 3. Service Tests (`src/__tests__/services/`)

#### `evaluationService.test.ts`
- ✅ Đánh giá interview thành công
- ✅ Xử lý transcripts rỗng
- ✅ Xử lý lỗi OpenAI API
- ✅ Xử lý JSON response không hợp lệ
- ✅ Missing skill scores
- ✅ Normalize scores 0-100
- ✅ Job role context
- ✅ Long transcripts
- ✅ Retry logic
- ✅ Multiple transcripts
- ✅ Helper functions

### 4. Component Tests (`src/__tests__/components/InteractiveAvatar/`)

#### `InteractiveAvatar.test.tsx`
- ✅ Render loading state
- ✅ Render avatar canvas khi connected
- ✅ Hiển thị error message
- ✅ Chat controls
- ✅ Auto prompt indicator
- ✅ Microphone/video toggle
- ✅ End session
- ✅ Display messages
- ✅ Typing indicator
- ✅ Avatar events
- ✅ Interview session controls
- ✅ Question navigation
- ✅ Session progress
- ✅ Answer evaluation
- ✅ Props handling
- ✅ Cleanup
- ✅ Accessibility
- ✅ Responsive design

### 5. Page Tests (`src/__tests__/app/avatar-interview/`)

#### `page.test.tsx`
- ✅ Render page với props đúng
- ✅ Pass props cho InteractiveAvatar
- ✅ Handle session end và redirect
- ✅ Loading state
- ✅ Error state
- ✅ Redirect khi thiếu jobRoleId
- ✅ Missing parameters
- ✅ Back button navigation
- ✅ Unauthorized access
- ✅ Loading auth state
- ✅ Parameter validation
- ✅ Special characters
- ✅ Session end với error
- ✅ Interview progress
- ✅ Browser navigation
- ✅ Page refresh
- ✅ Network issues
- ✅ Timeout scenarios
- ✅ Accessibility
- ✅ Responsive design
- ✅ Keyboard navigation
- ✅ Session persistence

## Cách chạy tests

### Chạy tất cả tests
```bash
npm test
```

### Chạy tests theo nhóm
```bash
# API tests
npm test src/__tests__/api/

# Hook tests
npm test src/__tests__/components/InteractiveAvatar/hooks/

# Service tests
npm test src/__tests__/services/

# Component tests
npm test src/__tests__/components/InteractiveAvatar/

# Page tests
npm test src/__tests__/app/avatar-interview/
```

### Chạy test cụ thể
```bash
npm test heygen-token.test.ts
npm test useAvatarControl.test.ts
npm test evaluationService.test.ts
```

### Chạy tests với coverage
```bash
npm run test:coverage
```

## Mock Strategy

### 1. External Dependencies
- **Heygen SDK**: Mock toàn bộ methods và events
- **OpenAI/Azure APIs**: Mock generateResponse function
- **Prisma**: Mock database operations
- **Clerk Auth**: Mock useAuth hook
- **Next.js Router**: Mock useRouter, useSearchParams

### 2. Browser APIs
- **fetch**: Mock global fetch
- **MediaDevices**: Mock getUserMedia
- **AudioContext**: Mock Web Audio API
- **sessionStorage**: Mock storage operations

### 3. Timers
- **setTimeout/setInterval**: Sử dụng vi.useFakeTimers()
- **performance.now**: Mock performance API

## Test Coverage Goals

- **API Routes**: 100% coverage
- **Hooks**: 95%+ coverage
- **Services**: 90%+ coverage
- **Components**: 85%+ coverage
- **Pages**: 80%+ coverage

## Best Practices

### 1. Test Structure
- Mỗi test file focus vào một module/component
- Sử dụng describe blocks để nhóm tests
- Test names mô tả rõ ràng behavior

### 2. Mocking
- Mock external dependencies
- Sử dụng vi.resetAllMocks() trong beforeEach
- Mock realistic responses

### 3. Assertions
- Test happy path và error cases
- Verify function calls với đúng parameters
- Test state changes
- Test side effects

### 4. Async Testing
- Sử dụng async/await cho async operations
- Sử dụng waitFor cho UI updates
- Test loading states

### 5. Error Handling
- Test error boundaries
- Test network failures
- Test invalid inputs
- Test edge cases

## Debugging Tests

### 1. Verbose Output
```bash
npm test -- --verbose
```

### 2. Debug Mode
```bash
npm test -- --debug
```

### 3. Watch Mode
```bash
npm test -- --watch
```

### 4. Specific Test
```bash
npm test -- --run test-name
```

## Continuous Integration

Tests sẽ chạy tự động trong CI/CD pipeline:

1. **Pre-commit**: Chạy tests trước khi commit
2. **Pull Request**: Chạy full test suite
3. **Deploy**: Chạy tests trước khi deploy

## Performance Testing

### 1. Load Testing
- Test với nhiều concurrent users
- Test memory usage
- Test response times

### 2. Stress Testing
- Test với large datasets
- Test với slow network
- Test với limited resources

## Security Testing

### 1. Input Validation
- Test XSS prevention
- Test SQL injection prevention
- Test CSRF protection

### 2. Authentication
- Test unauthorized access
- Test token validation
- Test session management

## Accessibility Testing

### 1. Screen Readers
- Test ARIA labels
- Test keyboard navigation
- Test focus management

### 2. Color Contrast
- Test WCAG compliance
- Test color blind friendly

## Future Improvements

1. **E2E Tests**: Thêm Cypress/Playwright tests
2. **Visual Regression**: Thêm visual testing
3. **Performance Tests**: Thêm performance benchmarks
4. **Security Tests**: Thêm security scanning
5. **Accessibility Tests**: Thêm automated a11y testing
