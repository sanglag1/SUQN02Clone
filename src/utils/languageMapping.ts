// Language mapping utility for AI services
export type UILanguage = 'vi' | 'en' | 'zh' | 'ja' | 'ko';
export type AILanguage = 'vi-VN' | 'en-US' | 'zh-CN' | 'ja-JP' | 'ko-KR';

// Mapping from UI language codes to AI language codes
const LANGUAGE_MAPPING: Record<UILanguage, AILanguage> = {
  'vi': 'vi-VN',
  'en': 'en-US',
  'zh': 'zh-CN',
  'ja': 'ja-JP',
  'ko': 'ko-KR'
};

/**
 * Convert UI language code to AI language code
 * @param uiLanguage - Language code from UI (vi, en, zh, ja, ko)
 * @returns AI language code (vi-VN, en-US, zh-CN, ja-JP, ko-KR)
 */
export function mapUILanguageToAI(uiLanguage: string): AILanguage {
  const normalizedLanguage = uiLanguage.toLowerCase() as UILanguage;
  return LANGUAGE_MAPPING[normalizedLanguage] || 'en-US';
}

/**
 * Get display name for language code
 * @param languageCode - Language code
 * @returns Display name
 */
export function getLanguageDisplayName(languageCode: string): string {
  const displayNames: Record<string, string> = {
    'vi': 'Vietnamese',
    'en': 'English',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'vi-VN': 'Vietnamese',
    'en-US': 'English',
    'zh-CN': 'Chinese',
    'ja-JP': 'Japanese',
    'ko-KR': 'Korean'
  };
  
  return displayNames[languageCode] || 'English';
}

/**
 * Check if language is supported for AI
 * @param languageCode - Language code to check
 * @returns True if supported
 */
export function isLanguageSupported(languageCode: string): boolean {
  const supportedLanguages = ['vi', 'en', 'zh', 'ja', 'ko', 'vi-VN', 'en-US', 'zh-CN', 'ja-JP', 'ko-KR'];
  return supportedLanguages.includes(languageCode.toLowerCase());
}
