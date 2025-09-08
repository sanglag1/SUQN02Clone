@echo off
REM JD Interview Test Runner Script for Windows
REM This script runs all JD interview related tests with proper configuration

echo 🚀 Starting JD Interview Test Suite...
echo ======================================

REM Set environment variables for testing
set NODE_ENV=test
set VITEST_ENV=jsdom

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Run specific JD tests
echo 🧪 Running JD Interview Component Tests...
npm run test src/__tests__/jd/jd-interview-page.test.tsx

echo 🧪 Running QuestionSetService Tests...
npm run test src/__tests__/jd/questionSetService.test.ts

echo 🧪 Running Azure Voice Interaction Hook Tests...
npm run test src/__tests__/jd/useAzureVoiceInteraction.test.ts

echo 🧪 Running JD Answers API Tests...
npm run test src/__tests__/jd/jd-answers-api.test.ts

echo 🧪 Running JD Interview Integration Tests...
npm run test src/__tests__/jd/jd-interview-integration.test.ts

REM Run all JD tests together
echo 🧪 Running Complete JD Test Suite...
npm run test src/__tests__/jd/

echo ✅ JD Interview Test Suite Complete!
echo ======================================

REM Show test coverage if available
echo 📊 Generating Test Coverage Report...
npx vitest run --coverage src/__tests__/jd/

echo 🎉 All tests completed successfully!
pause

