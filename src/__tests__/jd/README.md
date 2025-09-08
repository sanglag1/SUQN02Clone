# JD Interview Test Suite

This directory contains comprehensive unit tests for the JD (Job Description) Interview functionality. The test suite covers all aspects of the interview system including components, services, hooks, and API endpoints.

## 🧪 Test Coverage

### 1. **JD Interview Page Component** (`jd-interview-page.test.tsx`)
- **Component Rendering**: Tests the main interview interface, question display, tips, and progress statistics
- **Answer Input Functionality**: Tests text input, character counting, and validation
- **Voice Interaction**: Tests microphone integration and recording states
- **Answer Submission**: Tests submit button states, loading states, and form validation
- **Navigation Between Questions**: Tests previous/next question navigation and button states
- **Error Handling**: Tests error message display, dismissal, and recovery actions
- **AI Feedback Display**: Tests feedback states, loading indicators, and result display
- **Question Set Loading**: Tests data loading from localStorage and database
- **URL Parameter Handling**: Tests URL parameter extraction and question indexing
- **State Management**: Tests state persistence, navigation state, and progress tracking
- **Accessibility**: Tests ARIA labels, keyboard navigation, and screen reader support

### 2. **QuestionSetService** (`questionSetService.test.ts`)
- **CRUD Operations**: Tests create, read, update, and delete operations
- **Error Handling**: Tests network errors, server errors, and malformed responses
- **Data Validation**: Tests input validation and response format validation
- **Service Configuration**: Tests base URL configuration and HTTP method handling
- **Edge Cases**: Tests empty responses, null values, and undefined data

### 3. **Azure Voice Interaction Hook** (`useAzureVoiceInteraction.test.ts`)
- **Initialization**: Tests hook setup with default and custom parameters
- **Microphone Permission**: Tests permission checking and error handling
- **Voice Recognition Control**: Tests start/stop listening functionality
- **Speech Result Handling**: Tests final and interim speech results
- **Silence Timeout**: Tests automatic transcript sending after silence
- **Cleanup and Error Handling**: Tests timeout clearing and error management
- **State Management**: Tests listening states and initialization tracking
- **Edge Cases**: Tests rapid interactions and multiple speech results

### 4. **JD Answers API** (`jd-answers-api.test.ts`)
- **POST Operations**: Tests answer creation and updates
- **GET Operations**: Tests answer retrieval with and without filters
- **PUT Operations**: Tests answer updates and modifications
- **DELETE Operations**: Tests answer deletion
- **Authentication**: Tests user authentication and authorization
- **Data Validation**: Tests required field validation and input sanitization
- **Error Handling**: Tests various error scenarios and graceful degradation
- **Activity Tracking**: Tests user activity logging and analytics

### 5. **Integration Tests** (`jd-interview-integration.test.ts`)
- **Complete Interview Flow**: Tests end-to-end interview process
- **State Persistence**: Tests state management during navigation
- **Performance**: Tests rapid interactions and large inputs
- **Accessibility**: Tests keyboard navigation and screen reader support
- **Data Validation**: Tests input sanitization and security
- **Error Recovery**: Tests system recovery from various failure modes

## 🚀 Running the Tests

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- All project dependencies installed

### Quick Start
```bash
# Run all JD tests
npm run test src/__tests__/jd/

# Run specific test file
npm run test src/__tests__/jd/jd-interview-page.test.tsx

# Run tests in watch mode
npm run test:watch src/__tests__/jd/
```

### Using Test Scripts
```bash
# On Unix/Linux/macOS
chmod +x scripts/run-jd-tests.sh
./scripts/run-jd-tests.sh

# On Windows
scripts/run-jd-tests.bat
```

### Test Commands
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npx vitest run --coverage

# Run specific test pattern
npm run test -- --grep "JD Interview"
```

## 📊 Test Statistics

- **Total Test Files**: 5
- **Estimated Test Cases**: 150+
- **Coverage Areas**: Components, Services, Hooks, APIs, Integration
- **Test Types**: Unit, Integration, E2E simulation

## 🏗️ Test Architecture

### Mock Strategy
- **External Dependencies**: All external services and APIs are mocked
- **Browser APIs**: localStorage, fetch, history, clipboard are mocked
- **React Hooks**: Custom hooks are mocked where appropriate
- **Navigation**: Next.js navigation functions are mocked

### Test Utilities
- **React Testing Library**: For component rendering and interaction
- **User Event**: For realistic user interactions
- **Vitest**: For test running and mocking
- **Jest DOM**: For additional DOM matchers

### Test Data
- **Mock Question Sets**: Realistic interview questions and metadata
- **Mock User Responses**: Various answer lengths and content types
- **Mock API Responses**: Success and error scenarios
- **Mock User Interactions**: Typing, navigation, and submission

## 🔧 Configuration

### Vitest Configuration
```javascript
// vitest.config.mjs
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    css: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
```

### Test Setup
```typescript
// vitest.setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock Clerk authentication
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: null, isSignedIn: false, isLoaded: true }),
  // ... other mocks
}));
```

## 🐛 Troubleshooting

### Common Issues

1. **Test Environment Setup**
   ```bash
   # Clear test cache
   npx vitest --clearCache
   
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Mock Issues**
   ```bash
   # Check mock configuration
   npm run test -- --reporter=verbose
   
   # Verify mock imports
   # Ensure all mocks are properly configured in test files
   ```

3. **Component Rendering Issues**
   ```bash
   # Check for missing dependencies
   npm run test -- --reporter=verbose
   
   # Verify component imports
   # Check for missing CSS or style dependencies
   ```

### Debug Mode
```bash
# Run tests with debug output
DEBUG=vitest npm run test

# Run specific test with verbose output
npm run test -- --reporter=verbose --grep "JD Interview"
```

## 📈 Coverage Goals

- **Component Coverage**: 95%+
- **Service Coverage**: 100%
- **Hook Coverage**: 100%
- **API Coverage**: 100%
- **Integration Coverage**: 90%+

## 🔄 Continuous Integration

### GitHub Actions
```yaml
# .github/workflows/test.yml
- name: Run JD Interview Tests
  run: |
    npm run test src/__tests__/jd/
    npm run test:coverage src/__tests__/jd/
```

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test src/__tests__/jd/"
    }
  }
}
```

## 📚 Additional Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [User Event Testing](https://testing-library.com/docs/user-event/intro/)

## 🤝 Contributing

When adding new tests:

1. **Follow Naming Convention**: `*.test.ts` or `*.test.tsx`
2. **Group Related Tests**: Use describe blocks for logical grouping
3. **Mock Dependencies**: Mock all external dependencies
4. **Test Edge Cases**: Include error scenarios and boundary conditions
5. **Maintain Coverage**: Ensure new code has adequate test coverage

## 📝 Test Maintenance

- **Regular Updates**: Update tests when components change
- **Dependency Updates**: Update mocks when dependencies change
- **Coverage Monitoring**: Monitor test coverage trends
- **Performance Testing**: Ensure tests run efficiently

---

**Last Updated**: December 2024  
**Test Suite Version**: 1.0.0  
**Maintainer**: Development Team

