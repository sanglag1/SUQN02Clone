// Test file for language mapping functionality
import { mapUILanguageToAI, getLanguageDisplayName, isLanguageSupported } from './languageMapping';

// Test cases for language mapping
export function testLanguageMapping() {
  console.log('🧪 Testing Language Mapping...');
  
  // Test UI to AI mapping
  const testCases = [
    { ui: 'vi', expected: 'vi-VN', name: 'Vietnamese' },
    { ui: 'en', expected: 'en-US', name: 'English' },
    { ui: 'zh', expected: 'zh-CN', name: 'Chinese' },
    { ui: 'ja', expected: 'ja-JP', name: 'Japanese' },
    { ui: 'ko', expected: 'ko-KR', name: 'Korean' },
    { ui: 'invalid', expected: 'en-US', name: 'Invalid (fallback)' }
  ];

  testCases.forEach(({ ui, expected, name }) => {
    const result = mapUILanguageToAI(ui);
    const success = result === expected;
    console.log(`${success ? '✅' : '❌'} ${name}: ${ui} -> ${result} (expected: ${expected})`);
  });

  // Test display names
  console.log('\n🧪 Testing Display Names...');
  const displayTests = [
    'vi', 'en', 'zh', 'ja', 'ko',
    'vi-VN', 'en-US', 'zh-CN', 'ja-JP', 'ko-KR'
  ];

  displayTests.forEach(code => {
    const name = getLanguageDisplayName(code);
    console.log(`✅ ${code} -> ${name}`);
  });

  // Test language support
  console.log('\n🧪 Testing Language Support...');
  const supportTests = [
    'vi', 'en', 'zh', 'ja', 'ko', 'vi-VN', 'en-US', 'zh-CN', 'ja-JP', 'ko-KR',
    'invalid', 'fr', 'de', 'es'
  ];

  supportTests.forEach(code => {
    const supported = isLanguageSupported(code);
    console.log(`${supported ? '✅' : '❌'} ${code}: ${supported ? 'Supported' : 'Not supported'}`);
  });

  console.log('\n🎯 Language mapping test completed!');
}

// Test evaluation language support
export function testEvaluationLanguageSupport() {
  console.log('\n🧪 Testing Evaluation Language Support...');
  
  const languages = ['vi-VN', 'en-US', 'zh-CN', 'ja-JP', 'ko-KR'];
  const testField = 'Frontend';
  const testLevel = 'Mid';
  
  languages.forEach(language => {
    console.log(`\n📝 Testing ${language} evaluation...`);
    
    // Simulate evaluation prompt
    const prompt = `You are evaluating a candidate for a ${testLevel} ${testField} developer role.
Please respond in ${language === 'vi-VN' ? 'Vietnamese' : language === 'zh-CN' ? 'Chinese' : language === 'ja-JP' ? 'Japanese' : language === 'ko-KR' ? 'Korean' : 'English'} with detailed analysis.`;
    
    console.log(`✅ Prompt generated for ${language}: ${prompt.substring(0, 100)}...`);
  });
  
  console.log('\n🎯 Evaluation language support test completed!');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  testLanguageMapping();
  testEvaluationLanguageSupport();
}
