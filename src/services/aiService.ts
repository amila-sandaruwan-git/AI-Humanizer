// src/services/aiService.ts

import { HumanizeRequest, HumanizeResponse } from '../types';
import { 
  allReplacements, 
  sentenceStarters, 
  sentenceEnders,
  transitionWords,
  intensifiers,
  getRandomReplacement,
  hasReplacement,
} from './dictionary';

// Export similarity calculation
export const calculateSimilarity = (text1: string, text2: string): number => {
  const getBigrams = (text: string): string[] => {
    const words = text.toLowerCase().split(/\s+/);
    const bigrams: string[] = [];
    for (let i = 0; i < words.length - 1; i++) {
      bigrams.push(`${words[i]} ${words[i + 1]}`);
    }
    return bigrams;
  };
  
  const bigrams1 = getBigrams(text1);
  const bigrams2 = getBigrams(text2);
  
  const intersection = bigrams1.filter(b => bigrams2.includes(b));
  const union = new Set([...bigrams1, ...bigrams2]);
  
  if (union.size === 0) return 0;
  return Math.round((intersection.length / union.size) * 100);
};

// ============ LANGUAGE TOOL API - ENHANCED ============

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

// Categories we want to fix (grammar, not style)
const GRAMMAR_CATEGORIES = [
  'GRAMMAR',
  'TYPOS',
  'PUNCTUATION',
  'CASING',
  'AGREEMENT',
  'VERB_FORM',
];

// Rule IDs that should be SKIPPED (too aggressive or break proper nouns)
const SKIP_RULES = [
  'UPPERCASE_SENTENCE_START', // We handle this ourselves
  'MORFOLOGIK_RULE_EN_US',    // Spelling - too aggressive with names
  'EN_QUOTES',                // Quote style - personal preference
  'WHITESPACE_RULE',          // We handle this
  'PASSIVE_VOICE',            // Not a grammar error
  'STYLE',                    // Style suggestions, not grammar
];

const checkGrammarWithLanguageTool = async (text: string, language: string = 'en-US'): Promise<GrammarResponse> => {
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
        level: 'picky', // Gets more suggestions
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

// Enhanced correction applier - only apply high-confidence corrections
const applyGrammarAPICorrections = (text: string, matches: GrammarMatch[]): string => {
  if (!matches || matches.length === 0) return text;
  
  // Filter matches to only include grammar issues (not style)
  const grammarMatches = matches.filter(match => {
    // Skip certain rule IDs
    if (SKIP_RULES.includes(match.rule.id)) return false;
    
    // Only include grammar categories
    const categoryName = match.rule.category?.name?.toUpperCase() || '';
    const issueType = match.rule.issueType?.toLowerCase() || '';
    
    // Check if it's a grammar issue
    const isGrammarIssue = 
      GRAMMAR_CATEGORIES.some(cat => categoryName.includes(cat)) ||
      issueType === 'grammar' ||
      issueType === 'misspelling' ||
      issueType === 'typography' ||
      issueType === 'duplication' ||
      issueType === 'inconsistency';
    
    // Skip if it's a style suggestion
    if (issueType === 'style') return false;
    
    // Only fix if we have a replacement
    if (!match.replacements || match.replacements.length === 0) return false;
    
    return isGrammarIssue;
  });
  
  if (grammarMatches.length === 0) return text;
  
  // Sort by offset in REVERSE order (to avoid shifting positions)
  const sortedMatches = [...grammarMatches].sort((a, b) => b.offset - a.offset);
  
  let result = text;
  
  for (const match of sortedMatches) {
    // Take the FIRST replacement (usually the best one)
    const replacement = match.replacements[0].value;
    
    // Get the word being replaced to check if it's a proper noun
    const originalWord = result.substring(match.offset, match.offset + match.length);
    
    // Skip if the original is a proper noun (starts with capital, not at sentence start)
    const isAtSentenceStart = match.offset === 0 || 
      /[.!?]\s+$/.test(result.substring(0, match.offset));
    
    if (!isAtSentenceStart && /^[A-Z]/.test(originalWord.trim())) {
      continue; // Skip proper nouns
    }
    
    // Skip if it's an acronym
    const cleanOriginal = originalWord.replace(/[^a-zA-Z]/g, '');
    if (cleanOriginal.length >= 2 && cleanOriginal === cleanOriginal.toUpperCase()) {
      continue;
    }
    
    // Apply the correction
    const before = result.substring(0, match.offset);
    const after = result.substring(match.offset + match.length);
    result = before + replacement + after;
  }
  
  return result;
};

// ============ PROPER NOUN DETECTION ============

const PROTECTED_WORDS = new Set([
  // Common names
  'amila', 'sandaruwan', 'john', 'jane', 'smith', 'david', 'sarah', 'michael',
  'james', 'robert', 'william', 'mary', 'patricia', 'jennifer', 'linda',
  // Countries and cities
  'america', 'american', 'england', 'english', 'france', 'french', 'germany',
  'italy', 'spain', 'china', 'japan', 'india', 'korea', 'russia', 'brazil',
  'canada', 'australia', 'london', 'paris', 'tokyo', 'colombo', 'sri', 'lanka',
  // Brands
  'google', 'microsoft', 'apple', 'amazon', 'facebook', 'twitter', 'netflix',
  // Tech
  'react', 'angular', 'vue', 'javascript', 'typescript', 'python', 'java',
  'html', 'css', 'sql', 'mongodb', 'docker', 'linux', 'windows', 'android',
  'github', 'openai', 'gemini', 'claude',
  // Days and months
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'june', 'july', 'august',
  'september', 'october', 'november', 'december',
]);

const isProperNoun = (originalWord: string, cleanWord: string): boolean => {
  if (PROTECTED_WORDS.has(cleanWord.toLowerCase())) return true;
  
  const wordWithoutPunctuation = originalWord.replace(/^[^a-zA-Z]*/, '').replace(/[^a-zA-Z]*$/, '');
  if (wordWithoutPunctuation.length === 0) return false;
  
  return /^[A-Z]/.test(wordWithoutPunctuation);
};

const isAcronym = (word: string): boolean => {
  const clean = word.replace(/[^a-zA-Z]/g, '');
  return clean.length >= 2 && clean === clean.toUpperCase();
};

const containsNumbers = (word: string): boolean => {
  return /\d/.test(word);
};

// ============ NATURAL LANGUAGE TRANSFORMATIONS ============

// 1. Remove AI Transition Words - SAFER VERSION
const removeAITransitions = (text: string): string => {
  const aiTransitions = [
    'furthermore', 'moreover', 'additionally', 'consequently', 
    'accordingly', 'nonetheless', 'notwithstanding',
  ];
  
  let result = text;
  for (const word of aiTransitions) {
    // Only remove if it starts a sentence (safer)
    const regex = new RegExp(`(^|[.!?]\\s+)${word},\\s*`, 'gi');
    result = result.replace(regex, '$1');
  }
  return result;
};

// 2. Simplify Verbs - PRESERVES PROPER NOUNS
const simplifyVerbs = (text: string): string => {
  const complexToSimple: { [key: string]: string } = {
    'utilize': 'use', 'utilizes': 'uses', 'utilized': 'used', 'utilizing': 'using',
    'demonstrate': 'show', 'demonstrates': 'shows', 'demonstrated': 'showed', 'demonstrating': 'showing',
    'facilitate': 'help', 'facilitates': 'helps', 'facilitated': 'helped', 'facilitating': 'helping',
    'commence': 'start', 'commenced': 'started', 'commencing': 'starting',
    'terminate': 'end', 'terminated': 'ended', 'terminating': 'ending',
    'obtain': 'get', 'obtained': 'got', 'obtaining': 'getting',
    'acquire': 'get', 'acquired': 'got', 'acquiring': 'getting',
    'endeavor': 'try', 'endeavored': 'tried', 'endeavoring': 'trying',
    'ascertain': 'find out', 'ascertained': 'found out', 'ascertaining': 'finding out',
    'elucidate': 'explain', 'elucidated': 'explained', 'elucidating': 'explaining',
  };
  
  let result = text;
  for (const [complex, simple] of Object.entries(complexToSimple)) {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      // Preserve capitalization
      if (/^[A-Z]/.test(match)) {
        return simple.charAt(0).toUpperCase() + simple.slice(1);
      }
      return simple;
    });
  }
  return result;
};

// 3. Cut Filler
const cutFiller = (text: string): string => {
  const fillerPatterns = [
    { regex: /\bin order to\b/gi, replacement: 'to' },
    { regex: /\bthe fact that\b/gi, replacement: 'that' },
    { regex: /\bdue to the fact that\b/gi, replacement: 'because' },
    { regex: /\bin the event that\b/gi, replacement: 'if' },
    { regex: /\bat this point in time\b/gi, replacement: 'now' },
    { regex: /\bfor the purpose of\b/gi, replacement: 'for' },
    { regex: /\bwith regard to\b/gi, replacement: 'about' },
    { regex: /\bin regards to\b/gi, replacement: 'about' },
    { regex: /\bprior to\b/gi, replacement: 'before' },
    { regex: /\bsubsequent to\b/gi, replacement: 'after' },
  ];
  
  let result = text;
  for (const pattern of fillerPatterns) {
    result = result.replace(pattern.regex, pattern.replacement);
  }
  return result;
};

// 4. Mix Sentence Lengths
const mixSentenceLengths = (text: string): string => {
  if (/^#{1,6}\s/.test(text) || /^[•·▪◦●■□*\-+]/.test(text)) return text;
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= 1) return text;
  
  let result = [];
  let currentIndex = 0;
  
  while (currentIndex < sentences.length) {
    if (Math.random() < 0.15 && currentIndex < sentences.length - 1) {
      const combined = sentences[currentIndex].trim() + ' ' + sentences[currentIndex + 1].trim().toLowerCase();
      result.push(combined);
      currentIndex += 2;
    } else {
      result.push(sentences[currentIndex]);
      currentIndex++;
    }
  }
  
  return result.join(' ');
};

// 5. Vary Sentence Starters
const varySentenceStarters = (text: string): string => {
  if (/^#{1,6}\s/.test(text) || /^[•·▪◦●■□*\-+]/.test(text)) return text;
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= 1) return text;
  
  const naturalStarters = [
    'Honestly,', 'To be honest,', 'Frankly,', 
    'In my view,', 'The way I see it,', 'From my perspective,',
    'Interestingly,', 'Surprisingly,', 'Notably,',
  ];
  
  let result = [];
  let usedStarters = new Set();
  
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i].trim();
    if (sentence.split(' ').length > 5 && i > 0 && Math.random() < 0.2) {
      let starter;
      let attempts = 0;
      do {
        starter = naturalStarters[Math.floor(Math.random() * naturalStarters.length)];
        attempts++;
      } while (usedStarters.has(starter) && attempts < 10);
      usedStarters.add(starter);
      sentence = starter + ' ' + sentence.charAt(0).toLowerCase() + sentence.slice(1);
    }
    result.push(sentence);
  }
  
  return result.join(' ');
};

// 6. Add Natural Contractions
const addNaturalContractions = (text: string): string => {
  const contractions: { [key: string]: string } = {
    'i am': "I'm", 'i have': "I've", 'i will': "I'll", 'i would': "I'd",
    'you are': "you're", 'you have': "you've", 'you will': "you'll", 'you would': "you'd",
    'we are': "we're", 'we have': "we've", 'we will': "we'll", 'we would': "we'd",
    'they are': "they're", 'they have': "they've", 'they will': "they'll", 'they would': "they'd",
    'he is': "he's", 'he has': "he's", 'he will': "he'll", 'he would': "he'd",
    'she is': "she's", 'she has': "she's", 'she will': "she'll", 'she would': "she'd",
    'it is': "it's", 'it has': "it's", 'it will': "it'll",
    'would not': "wouldn't", 'could not': "couldn't", 'should not': "shouldn't",
    'will not': "won't", 'cannot': "can't", 'do not': "don't", 'does not': "doesn't",
    'did not': "didn't", 'have not': "haven't", 'has not': "hasn't", 'had not': "hadn't",
    'are not': "aren't", 'is not': "isn't", 'was not': "wasn't", 'were not': "weren't",
  };
  
  let result = text;
  for (const [formal, casual] of Object.entries(contractions)) {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi');
    result = result.replace(regex, casual);
  }
  return result;
};

// 7. Replace Generic Phrases
const makeMoreSpecific = (text: string): string => {
  const genericToSpecific: { [key: string]: string[] } = {
    'a lot of': ['many', 'numerous', 'countless'],
    'lots of': ['many', 'numerous', 'countless'],
    'a lot': ['many', 'numerous'],
    'stuff': ['things', 'items', 'elements'],
    'nice': ['great', 'excellent', 'remarkable'],
    'good': ['great', 'excellent', 'fine', 'superior'],
    'bad': ['poor', 'terrible', 'awful', 'inferior'],
    'big': ['large', 'huge', 'massive', 'enormous'],
    'small': ['little', 'tiny', 'compact', 'mini'],
    'important': ['key', 'critical', 'essential', 'vital'],
  };
  
  let result = text;
  for (const [generic, specific] of Object.entries(genericToSpecific)) {
    const regex = new RegExp(`\\b${generic}\\b`, 'gi');
    result = result.replace(regex, () => {
      return specific[Math.floor(Math.random() * specific.length)];
    });
  }
  return result;
};

// ============ PRESERVE STRUCTURE ============
const preserveStructure = (text: string, humanizeFn: (line: string) => string): string => {
  const paragraphs = text.split(/\n\s*\n/);
  
  const processedParagraphs = paragraphs.map(paragraph => {
    const lines = paragraph.split(/\n/);
    
    const processedLines = lines.map(line => {
      const leadingWhitespace = line.match(/^\s*/)?.[0] || '';
      const trailingWhitespace = line.match(/\s*$/)?.[0] || '';
      const content = line.trim();
      
      if (!content) return line;
      
      const bulletMatch = content.match(/^([•·▪◦●■□*\-+]|\d+[.)]|[a-zA-Z][.)])(\s+)/);
      if (bulletMatch) {
        const bullet = bulletMatch[1];
        const space = bulletMatch[2];
        const textContent = content.substring(bulletMatch[0].length);
        const humanizedContent = humanizeFn(textContent);
        return `${leadingWhitespace}${bullet}${space}${humanizedContent}${trailingWhitespace}`;
      }
      
      const headingMatch = content.match(/^(#{1,6})\s+(.+)/);
      if (headingMatch) {
        const hashes = headingMatch[1];
        const headingText = headingMatch[2];
        const humanizedHeading = humanizeFn(headingText);
        return `${leadingWhitespace}${hashes} ${humanizedHeading}${trailingWhitespace}`;
      }
      
      const humanizedContent = humanizeFn(content);
      return `${leadingWhitespace}${humanizedContent}${trailingWhitespace}`;
    });
    
    return processedLines.join('\n');
  });
  
  return processedParagraphs.join('\n\n');
};

// ============ WORD REPLACEMENT - STRICT MODE ============
const replaceWordsInLine = (line: string, rate: number): string => {
  const words = line.split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const originalWord = words[i];
    const cleanWord = originalWord.toLowerCase().replace(/[^a-z]/g, '');
    
    if (!cleanWord) continue;
    
    if (i === 0 && (line.trim().startsWith('#') || /^[•·▪◦●■□*\-+]|\d+[.)]|[a-zA-Z][.)]/.test(cleanWord))) {
      continue;
    }
    
    if (PROTECTED_WORDS.has(cleanWord)) continue;
    if (i > 0 && isProperNoun(originalWord, cleanWord)) continue;
    if (isAcronym(originalWord)) continue;
    if (containsNumbers(originalWord)) continue;
    if (!hasReplacement(cleanWord)) continue;
    if (Math.random() >= rate) continue;
    
    const replacement = getRandomReplacement(cleanWord);
    if (!replacement) continue;
    
    const punctuationPrefix = originalWord.match(/^[^a-zA-Z]*/)?.[0] || '';
    const punctuationSuffix = originalWord.match(/[^a-zA-Z]*$/)?.[0] || '';
    const wordWithoutPunctuation = originalWord.replace(/^[^a-zA-Z]*/, '').replace(/[^a-zA-Z]*$/, '');
    const isCapitalized = /^[A-Z]/.test(wordWithoutPunctuation);
    
    let finalReplacement = replacement;
    if (isCapitalized && replacement.length > 0) {
      finalReplacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    
    words[i] = punctuationPrefix + finalReplacement + punctuationSuffix;
  }
  
  return words.join(' ');
};

// ============ LIGHT RESTRUCTURE ============
const lightRestructure = (sentence: string): string => {
  const words = sentence.split(' ');
  if (words.length > 6 && Math.random() < 0.3) {
    const moveCount = Math.floor(Math.random() * 2) + 1;
    const moved = words.splice(0, moveCount);
    words.push(...moved);
    return words.join(' ');
  }
  return sentence;
};

// ============ HUMANIZATION LEVELS ============
const applyLightHumanization = (text: string): string => {
  return preserveStructure(text, (line) => {
    if (!line.trim()) return line;
    let result = replaceWordsInLine(line, 0.55);
    result = simplifyVerbs(result);
    result = cutFiller(result);
    return result;
  });
};

const applyMediumHumanization = (text: string): string => {
  return preserveStructure(text, (line) => {
    if (!line.trim()) return line;
    
    let result = replaceWordsInLine(line, 0.75);
    result = simplifyVerbs(result);
    result = cutFiller(result);
    result = removeAITransitions(result);
    
    if (Math.random() < 0.2) {
      result = lightRestructure(result);
    }
    
    return result;
  });
};

const applyHeavyHumanization = (text: string): string => {
  return preserveStructure(text, (line) => {
    if (!line.trim()) return line;
    
    let result = replaceWordsInLine(line, 0.90);
    result = removeAITransitions(result);
    result = simplifyVerbs(result);
    result = cutFiller(result);
    result = addNaturalContractions(result);
    result = makeMoreSpecific(result);
    
    return result;
  });
};

// ============ MAIN HUMANIZATION ============
export const humanizeText = async (
  request: HumanizeRequest
): Promise<HumanizeResponse> => {
  const { text, tone = 'professional', style = 'balanced', intensity = 'medium' } = request;
  
  let humanized = text;
  let changes = {
    sentencesRewritten: 0,
    wordsChanged: 0,
  };

  const originalWords = text.split(/\s+/).length;
  const originalSentences = text.match(/[^.!?]+[.!?]+/g)?.length || 1;
  
  // Step 1: Apply humanization
  switch (intensity) {
    case 'light':
      humanized = applyLightHumanization(text);
      changes = {
        sentencesRewritten: Math.floor(originalSentences * 0.3),
        wordsChanged: Math.floor(originalWords * 0.55),
      };
      break;
      
    case 'medium':
      humanized = applyMediumHumanization(text);
      changes = {
        sentencesRewritten: Math.floor(originalSentences * 0.5),
        wordsChanged: Math.floor(originalWords * 0.75),
      };
      break;
      
    case 'heavy':
      humanized = applyHeavyHumanization(text);
      changes = {
        sentencesRewritten: Math.floor(originalSentences * 0.8),
        wordsChanged: Math.floor(originalWords * 0.90),
      };
      break;
      
    default:
      humanized = text;
  }
  
  // Step 2: Apply LanguageTool API for grammar checking
  try {
    const language = tone === 'casual' ? 'en-US' : 'en-US';
    const grammarResult = await checkGrammarWithLanguageTool(humanized, language);
    
    if (grammarResult.matches && grammarResult.matches.length > 0) {
      const beforeLength = humanized.length;
      humanized = applyGrammarAPICorrections(humanized, grammarResult.matches);
      const afterLength = humanized.length;
      
      // Count grammar corrections as word changes
      if (beforeLength !== afterLength) {
        changes.wordsChanged += Math.abs(afterLength - beforeLength) / 5;
      }
    }
  } catch (error) {
    console.warn('LanguageTool API failed, using text as-is:', error);
  }

  return {
    original: text,
    humanized: humanized || text,
    wordCount: {
      original: originalWords,
      humanized: (humanized || text).split(/\s+/).length,
    },
    changes,
  };
};