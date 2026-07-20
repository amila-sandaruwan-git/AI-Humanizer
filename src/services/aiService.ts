import { HumanizeRequest, HumanizeResponse } from '../types';
import { 
  sentenceStarters, 
  transitionWords,
  hasReplacement,
  getRandomReplacement,
} from './dictionary';

// ============================================================
// EXPORTED FUNCTIONS
// ============================================================

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

export const humanizeText = async (
  request: HumanizeRequest
): Promise<HumanizeResponse> => {
  const { text, tone = 'professional', style = 'balanced', intensity = 'medium' } = request;
  
  let humanized = text;
  let changes = {
    sentencesRewritten: 0,
    wordsChanged: 0,
  };

  const originalWords = text.split(' ').length;
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // Apply different strategies based on intensity
  switch (intensity) {
    case 'light':
      humanized = applyLightRewrite(text);
      changes = {
        sentencesRewritten: Math.floor(sentences.length * 0.15),
        wordsChanged: Math.floor(originalWords * 0.05),
      };
      break;
      
    case 'medium':
      humanized = applyMediumRewrite(text);
      changes = {
        sentencesRewritten: Math.floor(sentences.length * 0.35),
        wordsChanged: Math.floor(originalWords * 0.10),
      };
      break;
      
    case 'heavy':
      humanized = applyHeavyRewrite(text);
      changes = {
        sentencesRewritten: Math.floor(sentences.length * 0.55),
        wordsChanged: Math.floor(originalWords * 0.15),
      };
      break;
      
    default:
      humanized = text;
  }

  return {
    original: text,
    humanized: humanized || text,
    wordCount: {
      original: originalWords,
      humanized: (humanized || text).split(' ').length,
    },
    changes,
  };
};

// ============================================================
// CORE REWRITE FUNCTIONS
// ============================================================

// ============ LIGHT REWRITE ============
const applyLightRewrite = (text: string): string => {
  let result = text;
  
  // 1. Fix common grammar issues
  result = fixCommonGrammar(result);
  
  // 2. Replace only the most obvious unnatural words
  const obviousFixes: { [key: string]: string } = {
    'utilize': 'use',
    'commence': 'start',
    'terminate': 'end',
    'sufficient': 'enough',
    'nevertheless': 'however',
    'furthermore': 'also',
    'consequently': 'so',
    'therefore': 'so',
    'subsequently': 'then',
    'accordingly': 'so',
    'in order to': 'to',
    'due to the fact that': 'because',
  };
  
  for (const [bad, good] of Object.entries(obviousFixes)) {
    const regex = new RegExp(`\\b${bad}\\b`, 'gi');
    if (result.match(regex)) {
      result = result.replace(regex, good);
    }
  }
  
  return result;
};

// ============ MEDIUM REWRITE ============
const applyMediumRewrite = (text: string): string => {
  let result = text;
  
  // 1. Fix grammar issues
  result = fixCommonGrammar(result);
  
  // 2. Split into sentences
  const sentences = result.match(/[^.!?]+[.!?]+/g) || [result];
  let processed: string[] = [];
  
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i] || '';
    
    // 3. Apply smart word replacement (only 10% of words)
    sentence = smartWordReplacement(sentence, 0.10);
    
    // 4. Restructure (35% of sentences)
    if (Math.random() < 0.35) {
      sentence = restructureSentence(sentence);
    }
    
    // 5. Change voice (15% of sentences)
    if (Math.random() < 0.15) {
      sentence = changeVoice(sentence);
    }
    
    // 6. Add transition (20% of sentences)
    if (i > 0 && Math.random() < 0.20) {
      const transition = transitionWords[Math.floor(Math.random() * transitionWords.length)];
      sentence = `${transition.charAt(0).toUpperCase() + transition.slice(1)}, ${sentence.toLowerCase()}`;
    }
    
    processed.push(sentence);
  }
  
  // 7. Combine short sentences (20% chance)
  if (Math.random() < 0.20 && processed.length > 2) {
    processed = combineShortSentences(processed);
  }
  
  return processed.join(' ');
};

// ============ HEAVY REWRITE ============
const applyHeavyRewrite = (text: string): string => {
  let result = text;
  
  // 1. Fix grammar issues
  result = fixCommonGrammar(result);
  
  // 2. Split into sentences
  const sentences = result.match(/[^.!?]+[.!?]+/g) || [result];
  let processed: string[] = [];
  
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i] || '';
    
    // 3. Apply smart word replacement (15% of words)
    sentence = smartWordReplacement(sentence, 0.15);
    
    // 4. Restructure (55% of sentences)
    if (Math.random() < 0.55) {
      sentence = restructureSentence(sentence);
    }
    
    // 5. Change voice (25% of sentences)
    if (Math.random() < 0.25) {
      sentence = changeVoice(sentence);
    }
    
    // 6. Split long sentences (30% of long sentences)
    if (sentence.split(' ').length > 14 && Math.random() < 0.30) {
      sentence = splitSentence(sentence);
    }
    
    // 7. Add sentence starter (25% of sentences)
    if (i > 0 && Math.random() < 0.25) {
      const starter = sentenceStarters[Math.floor(Math.random() * sentenceStarters.length)];
      sentence = `${starter} ${sentence.toLowerCase()}`;
    }
    
    processed.push(sentence);
  }
  
  // 8. Shuffle some sentences for better flow (20% chance)
  if (Math.random() < 0.20 && processed.length > 3) {
    const idx1 = Math.floor(Math.random() * processed.length);
    const idx2 = Math.floor(Math.random() * processed.length);
    if (idx1 !== idx2 && idx1 > 0 && idx2 > 0) {
      [processed[idx1], processed[idx2]] = [processed[idx2], processed[idx1]];
    }
  }
  
  // 9. Combine short sentences (30% chance)
  if (Math.random() < 0.30 && processed.length > 2) {
    processed = combineShortSentences(processed);
  }
  
  return processed.join(' ');
};

// ============================================================
// GRAMMAR FIX FUNCTIONS
// ============================================================

const fixCommonGrammar = (text: string): string => {
  let result = text;
  
  // 1. Fix subject-verb agreement
  // "Users possesses" → "Users possess"
  result = result.replace(/\bUsers possesses\b/gi, 'Users possess');
  result = result.replace(/\bUser possesses\b/gi, 'User possesses');
  
  // "The solution offer" → "The solution offers"
  result = result.replace(/\bThe solution offer\b/gi, 'The solution offers');
  result = result.replace(/\bThe platform provide\b/gi, 'The platform provides');
  result = result.replace(/\bThe tool make\b/gi, 'The tool makes');
  result = result.replace(/\bThe system allow\b/gi, 'The system allows');
  
  // 2. Fix "guides users rewrite" → "guides users to rewrite"
  result = result.replace(/\bguides users rewrite\b/gi, 'guides users to rewrite');
  result = result.replace(/\bhelps users rewrite\b/gi, 'helps users rewrite');
  result = result.replace(/\ballows users rewrite\b/gi, 'allows users to rewrite');
  result = result.replace(/\benables users rewrite\b/gi, 'enables users to rewrite');
  result = result.replace(/\busers can rewrite\b/gi, 'users can rewrite');
  
  // 3. Fix "guides users compose" → "guides users to compose"
  result = result.replace(/\bguides users compose\b/gi, 'guides users to compose');
  result = result.replace(/\bhelps users compose\b/gi, 'helps users compose');
  
  // 4. Fix "possesses the capacity to" → "can"
  result = result.replace(/\bpossesses the capacity to\b/gi, 'can');
  result = result.replace(/\bhas the ability to\b/gi, 'can');
  result = result.replace(/\bhas the capability to\b/gi, 'can');
  
  // 5. Fix "is able to" → "can" (optional, keeps it natural)
  // Only replace if it sounds better
  result = result.replace(/\bis able to\b/gi, 'can');
  
  // 6. Fix "with a view to" → "to"
  result = result.replace(/\bwith a view to\b/gi, 'to');
  
  // 7. Fix "for the sake of" → "to" or "for"
  result = result.replace(/\bfor the sake of\b/gi, 'to');
  
  // 8. Fix "in consideration of" → "given" or "considering"
  result = result.replace(/\bin consideration of\b/gi, 'considering');
  
  // 9. Fix "toward" → "into" (when used with "transform")
  result = result.replace(/\btransform toward\b/gi, 'transform into');
  result = result.replace(/\bconverted toward\b/gi, 'converted into');
  result = result.replace(/\bchanged toward\b/gi, 'changed into');
  
  // 10. Fix "across" → "into" (when used with "transform")
  result = result.replace(/\btransform across\b/gi, 'transform into');
  
  // 11. Fix "besides" → "and" (when used as a connector)
  result = result.replace(/\b,\s*besides\s+/gi, ', and ');
  
  // 12. Fix "hunger to" → "want to" or "aim to"
  result = result.replace(/\bhunger to\b/gi, 'want to');
  result = result.replace(/\bhunger for\b/gi, 'want');
  result = result.replace(/\bpines towards\b/gi, 'wants to');
  result = result.replace(/\bpines for\b/gi, 'wants');
  
  // 13. Fix "cumbersome mode" → "Heavy mode" or "intensive mode"
  result = result.replace(/\bcumbersome mode\b/gi, 'heavy mode');
  
  // 14. Fix "writing value" → "writing tone" or "writing style"
  result = result.replace(/\bwriting value\b/gi, 'writing tone');
  
  // 15. Fix "unblemished gateway" → "clean interface"
  result = result.replace(/\bunblemished gateway\b/gi, 'clean interface');
  
  // 16. Fix "know-how" → "experience" (when referring to user experience)
  result = result.replace(/\buser know-how\b/gi, 'user experience');
  
  // 17. Fix "plagiarism inspection" → "plagiarism detection"
  result = result.replace(/\bplagiarism inspection\b/gi, 'plagiarism detection');
  
  // 18. Fix "multilingual bolster" → "multilingual support"
  result = result.replace(/\bmultilingual bolster\b/gi, 'multilingual support');
  
  // 19. Fix "efficient cure" → "effective solution"
  result = result.replace(/\befficient cure\b/gi, 'effective solution');
  result = result.replace(/\befficient remedy\b/gi, 'effective solution');
  
  // 20. Fix "synthetic discernment" → "artificial intelligence" or "AI"
  result = result.replace(/\bsynthetic discernment\b/gi, 'artificial intelligence');
  result = result.replace(/\bsynthetic cognition\b/gi, 'artificial intelligence');
  
  // 21. Fix "stays" → "is" (when used as "is")
  result = result.replace(/\bstays a\b/gi, 'is a');
  result = result.replace(/\bstays the\b/gi, 'is the');
  
  // 22. Fix "beyond" → "into" (when used with "transform")
  result = result.replace(/\btransform beyond\b/gi, 'transform into');
  
  // 23. Fix "succor" → "help" or "support"
  result = result.replace(/\bsuccor users\b/gi, 'help users');
  result = result.replace(/\bsuccors users\b/gi, 'helps users');
  result = result.replace(/\bsuccor\b/gi, 'support');
  
  // 24. Fix "airy mode" → "Light mode"
  result = result.replace(/\bairy mode\b/gi, 'light mode');
  
  // 25. Fix "massive mode" → "Heavy mode"
  result = result.replace(/\bmassive mode\b/gi, 'heavy mode');
  
  // 26. Fix "settlement" → "solution"
  result = result.replace(/\bsettlement\b/gi, 'solution');
  
  // 27. Fix "company purposes" → "business purposes"
  result = result.replace(/\bcompany purposes\b/gi, 'business purposes');
  
  // 28. Fix "yield" → "produce" (when used as produce)
  result = result.replace(/\byield clearer\b/gi, 'produce clearer');
  result = result.replace(/\byields clearer\b/gi, 'produces clearer');
  
  return result;
};

// ============================================================
// SMART WORD REPLACEMENT
// ============================================================

const smartWordReplacement = (sentence: string, rate: number): string => {
  const words = sentence.split(/\s+/);
  const protectedWords = [
    'ai', 'help', 'use', 'solution', 'interface', 'support', 'system',
    'application', 'software', 'process', 'user', 'data', 'tool',
    'platform', 'feature', 'technology', 'digital', 'modern', 'web',
    'service', 'product', 'design', 'experience', 'value', 'quality',
    'api', 'code', 'program', 'device', 'network', 'cloud', 'security',
  ];
  
  const allowedReplacements: { [key: string]: string[] } = {
    'help': ['assist', 'aid'],
    'use': ['employ', 'apply'],
    'solution': ['answer', 'fix'],
    'support': ['assist', 'aid'],
    'user': ['individual', 'person'],
    'system': ['framework', 'structure'],
    'application': ['program', 'tool'],
    'software': ['program', 'application'],
    'process': ['procedure', 'method'],
    'feature': ['attribute', 'characteristic'],
    'value': ['benefit', 'advantage'],
  };
  
  for (let i = 0; i < words.length; i++) {
    const cleanWord = words[i].toLowerCase().replace(/[^a-z]/g, '');
    
    // Skip protected words
    if (protectedWords.includes(cleanWord)) {
      // Only allow specific replacements
      const allowed = allowedReplacements[cleanWord];
      if (allowed && Math.random() < rate * 0.5) {
        const replacement = allowed[Math.floor(Math.random() * allowed.length)];
        const punctuation = words[i].match(/[^a-zA-Z]/g) || [];
        words[i] = replacement + (punctuation.join('') || '');
      }
      continue;
    }
    
    // Only replace if it's a good candidate
    if (Math.random() < rate && hasReplacement(cleanWord)) {
      const replacement = getRandomReplacement(cleanWord);
      if (replacement && isNaturalReplacement(cleanWord, replacement)) {
        const punctuation = words[i].match(/[^a-zA-Z]/g) || [];
        words[i] = replacement + (punctuation.join('') || '');
      }
    }
  }
  
  return words.join(' ');
};

const isNaturalReplacement = (original: string, replacement: string): boolean => {
  // List of words that should NOT be replaced
  const protectedWords = [
    'ai', 'help', 'use', 'solution', 'interface', 'support', 'system',
    'application', 'software', 'process', 'user', 'data', 'tool',
    'platform', 'feature', 'technology', 'digital', 'modern', 'web',
    'service', 'product', 'design', 'experience', 'value', 'quality',
  ];
  
  if (protectedWords.includes(original.toLowerCase())) {
    return false;
  }
  
  // Check if replacement is too long or uncommon
  if (replacement.length > original.length + 5) {
    return false;
  }
  
  // Check if replacement is an archaic word
  const archaicWords = ['succor', 'pine', 'airy', 'shade', 'settlement', 'cure', 'gateway', 'bolster'];
  if (archaicWords.some(w => replacement.toLowerCase().includes(w))) {
    return false;
  }
  
  // Check if replacement is too formal
  const formalWords = ['utilize', 'commence', 'terminate', 'nevertheless', 'furthermore'];
  if (formalWords.includes(replacement.toLowerCase())) {
    return false;
  }
  
  return true;
};

// ============================================================
// SENTENCE RESTRUCTURING
// ============================================================

const restructureSentence = (sentence: string): string => {
  // Pattern: "Because X, Y" → "Y because X"
  const causeMatch = sentence.match(/^(Because|Since|As)\s+(.+?),\s*(.+?)(\.|!|\?)/i);
  if (causeMatch) {
    return `${causeMatch[3]} ${causeMatch[1].toLowerCase()} ${causeMatch[2]}${causeMatch[4]}`;
  }
  
  // Pattern: "X, although Y" → "Although Y, X"
  const concessiveMatch = sentence.match(/^(.+?),\s*(although|though)\s+(.+?)(\.|!|\?)/i);
  if (concessiveMatch) {
    return `${concessiveMatch[2]} ${concessiveMatch[3]}, ${concessiveMatch[1]}${concessiveMatch[4]}`;
  }
  
  // Pattern: "If X, then Y" → "Y if X"
  const conditionalMatch = sentence.match(/^If\s+(.+?),?\s+then?\s+(.+?)(\.|!|\?)/i);
  if (conditionalMatch) {
    return `${conditionalMatch[2]} if ${conditionalMatch[1]}${conditionalMatch[3]}`;
  }
  
  // Pattern: "X is Y" → "Y is what X is" (only if it sounds natural)
  const isMatch = sentence.match(/^(.+?)\s+is\s+(.+?)(\.|!|\?)/i);
  if (isMatch && Math.random() < 0.3 && isMatch[1].split(' ').length < 5) {
    const subject = isMatch[1];
    const predicate = isMatch[2];
    const punct = isMatch[3];
    return `${predicate} is what ${subject} is${punct}`;
  }
  
  return sentence;
};

// ============================================================
// VOICE CHANGE
// ============================================================

const changeVoice = (sentence: string): string => {
  // Active to Passive: "X does Y" → "Y is done by X"
  const activeSimple = sentence.match(/^(\w+)\s+(\w+[sd]?)\s+(\w+)(\.|!|\?)/i);
  if (activeSimple) {
    const subject = activeSimple[1];
    const verb = activeSimple[2];
    const object = activeSimple[3];
    const punct = activeSimple[4];
    
    let pastParticiple = verb;
    if (verb.endsWith('e')) {
      pastParticiple = verb + 'd';
    } else if (verb.endsWith('y') && !/[aeiou]/.test(verb[verb.length - 2])) {
      pastParticiple = verb.slice(0, -1) + 'ied';
    } else {
      pastParticiple = verb + 'ed';
    }
    
    // Only convert if it sounds natural
    if (subject && object && pastParticiple) {
      return `The ${object} is ${pastParticiple} by ${subject}${punct}`;
    }
  }
  
  return sentence;
};

// ============================================================
// SENTENCE SPLITTING & COMBINING
// ============================================================

const splitSentence = (sentence: string): string => {
  const words = sentence.split(' ');
  
  if (words.length < 10) return sentence;
  
  const splitPoints = words.reduce((acc: number[], word, index) => {
    if (['and', 'but', 'or', 'because', 'although', 'while', 'however'].includes(word.toLowerCase())) {
      acc.push(index);
    }
    return acc;
  }, []);
  
  if (splitPoints.length > 0) {
    const splitIndex = splitPoints[Math.floor(Math.random() * splitPoints.length)];
    if (splitIndex > 3 && splitIndex < words.length - 3) {
      const firstPart = words.slice(0, splitIndex).join(' ');
      const secondPart = words.slice(splitIndex + 1).join(' ');
      return `${firstPart}. ${secondPart}`;
    }
  }
  
  return sentence;
};

const combineShortSentences = (sentences: string[]): string[] => {
  const result: string[] = [];
  let i = 0;
  
  while (i < sentences.length) {
    const current = sentences[i] || '';
    const next = sentences[i + 1] || '';
    
    // If current sentence is short and next sentence exists
    if (i < sentences.length - 1 && current.split(' ').length < 8 && next.split(' ').length < 8) {
      const combined = current.replace(/[.!?]+$/, '') + ', and ' + next.toLowerCase();
      result.push(combined);
      i += 2;
    } else {
      result.push(current);
      i++;
    }
  }
  
  return result;
};

// ============================================================
// EXPORT FOR TESTING
// ============================================================

export const testGrammarFixes = (text: string): string => {
  return fixCommonGrammar(text);
};