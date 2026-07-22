// src/services/grammarService.ts

interface GrammarMatch {
  message: string;
  shortMessage: string;
  replacements: { value: string }[];
  offset: number;
  length: number;
  rule: {
    id: string;
    description: string;
    issueType: string;
    category: { id: string; name: string };
  };
  context: { text: string; offset: number; length: number };
  sentence: string;
}

interface GrammarResponse {
  matches: GrammarMatch[];
  language: {
    name: string;
    code: string;
    detectedLanguage?: { name: string; code: string };
  };
  software: { name: string; version: string; buildDate: string };
}

export const checkGrammar = async (text: string, language: string = 'en-US'): Promise<GrammarResponse> => {
  try {
    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: text,
        language: language,
        enabledOnly: 'false',
      }),
    });

    if (!response.ok) {
      throw new Error(`Grammar check failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Grammar check error:', error);
    throw error;
  }
};

// Apply grammar corrections to text
export const applyGrammarCorrections = (text: string, matches: GrammarMatch[]): string => {
  let result = text;
  
  // Sort matches by offset in reverse order to avoid shifting issues
  const sortedMatches = [...matches].sort((a, b) => b.offset - a.offset);
  
  for (const match of sortedMatches) {
    if (match.replacements && match.replacements.length > 0) {
      const replacement = match.replacements[0].value;
      const before = result.substring(0, match.offset);
      const after = result.substring(match.offset + match.length);
      result = before + replacement + after;
    }
  }
  
  return result;
};