#!/bin/bash

# JD Interview Test Runner Script
# This script runs all JD interview related tests with proper configuration

echo "🚀 Starting JD Interview Test Suite..."
echo "======================================"

# Set environment variables for testing
export NODE_ENV=test
export VITEST_ENV=jsdom

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run specific JD tests
echo "🧪 Running JD Interview Component Tests..."
npm run test src/__tests__/jd/jd-interview-page.test.tsx

echo "🧪 Running QuestionSetService Tests..."
npm run test src/__tests__/jd/questionSetService.test.ts

echo "🧪 Running Azure Voice Interaction Hook Tests..."
npm run test src/__tests__/jd/useAzureVoiceInteraction.test.ts

echo "🧪 Running JD Answers API Tests..."
npm run test src/__tests__/jd/jd-answers-api.test.ts

echo "🧪 Running JD Interview Integration Tests..."
npm run test src/__tests__/jd/jd-interview-integration.test.ts

# Run all JD tests together
echo "🧪 Running Complete JD Test Suite..."
npm run test src/__tests__/jd/

echo "✅ JD Interview Test Suite Complete!"
echo "======================================"

# Show test coverage if available
if command -v npx &> /dev/null; then
    echo "📊 Generating Test Coverage Report..."
    npx vitest run --coverage src/__tests__/jd/
fi

echo "🎉 All tests completed successfully!"

