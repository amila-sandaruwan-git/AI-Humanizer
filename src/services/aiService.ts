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

// ============ LANGUAGE TOOL API INTEGRATION ============

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

const applyGrammarAPICorrections = (text: string, matches: GrammarMatch[]): string => {
  let result = text;
  
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

// ============ NATURAL LANGUAGE TRANSFORMATIONS ============

// 1. Remove AI Transition Words
const removeAITransitions = (text: string): string => {
  const aiTransitions = [
    'furthermore', 'moreover', 'additionally', 'consequently', 
    'accordingly', 'hence', 'thus', 'therefore', 'nonetheless',
    'nevertheless', 'notwithstanding', 'it is important to note',
    'it should be noted', 'it is worth mentioning', 'in conclusion',
    'to summarize', 'in summary', 'as previously mentioned'
  ];
  
  let result = text;
  for (const word of aiTransitions) {
    const regex = new RegExp(`\\b${word}\\b,?\\s*`, 'gi');
    result = result.replace(regex, '');
  }
  return result;
};

// 2. Replace Overly Complex Verbs with Simple Ones
const simplifyVerbs = (text: string): string => {
  const complexToSimple: { [key: string]: string } = {
    'utilize': 'use', 'utilizes': 'uses', 'utilized': 'used', 'utilizing': 'using',
    'demonstrate': 'show', 'demonstrates': 'shows', 'demonstrated': 'showed', 'demonstrating': 'showing',
    'facilitate': 'help', 'facilitates': 'helps', 'facilitated': 'helped', 'facilitating': 'helping',
    'implement': 'use', 'implemented': 'used', 'implementing': 'using',
    'commence': 'start', 'commenced': 'started', 'commencing': 'starting',
    'terminate': 'end', 'terminated': 'ended', 'terminating': 'ending',
    'obtain': 'get', 'obtained': 'got', 'obtaining': 'getting',
    'procure': 'get', 'procured': 'got', 'procuring': 'getting',
    'acquire': 'get', 'acquired': 'got', 'acquiring': 'getting',
    'endeavor': 'try', 'endeavored': 'tried', 'endeavoring': 'trying',
    'ascertain': 'find out', 'ascertained': 'found out', 'ascertaining': 'finding out',
    'expedite': 'speed up', 'expedited': 'sped up', 'expediting': 'speeding up',
    'augment': 'add to', 'augmented': 'added to', 'augmenting': 'adding to',
    'diminish': 'lessen', 'diminished': 'lessened', 'diminishing': 'lessening',
    'elucidate': 'explain', 'elucidated': 'explained', 'elucidating': 'explaining',
    'utilization': 'use', 'implementation': 'use', 'facilitation': 'help', 'demonstration': 'show'
  };
  
  let result = text;
  for (const [complex, simple] of Object.entries(complexToSimple)) {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    result = result.replace(regex, simple);
  }
  return result;
};

// 3. Cut Filler and Redundancy
const cutFiller = (text: string): string => {
  const fillerPatterns = [
    { regex: /\bin order to\b/gi, replacement: 'to' },
    { regex: /\bas a matter of fact\b/gi, replacement: '' },
    { regex: /\bin point of fact\b/gi, replacement: '' },
    { regex: /\bthe fact that\b/gi, replacement: 'that' },
    { regex: /\bas a result of the fact that\b/gi, replacement: 'because' },
    { regex: /\bdue to the fact that\b/gi, replacement: 'because' },
    { regex: /\bin the event that\b/gi, replacement: 'if' },
    { regex: /\bat this point in time\b/gi, replacement: 'now' },
    { regex: /\bin this day and age\b/gi, replacement: 'today' },
    { regex: /\bfor the purpose of\b/gi, replacement: 'for' },
    { regex: /\bwith regard to\b/gi, replacement: 'about' },
    { regex: /\bin regards to\b/gi, replacement: 'about' },
    { regex: /\bwith respect to\b/gi, replacement: 'about' },
    { regex: /\bin terms of\b/gi, replacement: 'of' },
    { regex: /\bas far as\s+(.+?)\s+is concerned\b/gi, replacement: 'for $1' },
    { regex: /\bin the process of\b/gi, replacement: 'while' },
    { regex: /\bat the same time as\b/gi, replacement: 'as' },
    { regex: /\bprior to\b/gi, replacement: 'before' },
    { regex: /\bsubsequent to\b/gi, replacement: 'after' },
    { regex: /\bin close proximity to\b/gi, replacement: 'near' },
  ];
  
  let result = text;
  for (const pattern of fillerPatterns) {
    result = result.replace(pattern.regex, pattern.replacement);
  }
  
  result = result.replace(/\b(really|very|quite|rather|pretty)\s+(really|very|quite|rather|pretty)\b/gi, '$1');
  return result;
};

// 4. Mix Sentence Lengths - MODIFIED to preserve paragraph structure
const mixSentenceLengths = (text: string): string => {
  // Only apply within a single paragraph (no paragraph breaks)
  // Skip if text has structural markers
  if (/^#{1,6}\s/.test(text) || /^[•·▪◦●■□*\-+]/.test(text)) {
    return text;
  }
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= 1) return text;
  
  let result = [];
  let currentIndex = 0;
  
  while (currentIndex < sentences.length) {
    if (Math.random() < 0.2 && currentIndex < sentences.length - 1) {
      const combined = sentences[currentIndex].trim() + ' ' + sentences[currentIndex + 1].trim().toLowerCase();
      result.push(combined);
      currentIndex += 2;
    } else if (Math.random() < 0.3 && sentences[currentIndex].split(' ').length > 15) {
      const words = sentences[currentIndex].split(' ');
      const mid = Math.floor(words.length / 2);
      let splitPoint = mid;
      for (let i = mid; i < Math.min(mid + 5, words.length - 2); i++) {
        if (['and', 'but', 'or', 'so', 'because', 'although'].includes(words[i].toLowerCase())) {
          splitPoint = i;
          break;
        }
      }
      const firstPart = words.slice(0, splitPoint).join(' ');
      const secondPart = words.slice(splitPoint + 1).join(' ');
      result.push(firstPart + '.');
      result.push(secondPart.charAt(0).toUpperCase() + secondPart.slice(1));
      currentIndex++;
    } else {
      result.push(sentences[currentIndex]);
      currentIndex++;
    }
  }
  
  return result.join(' ');
};

// 5. Vary Sentence Starters - MODIFIED to preserve paragraph structure
const varySentenceStarters = (text: string): string => {
  // Skip if text has structural markers
  if (/^#{1,6}\s/.test(text) || /^[•·▪◦●■□*\-+]/.test(text)) {
    return text;
  }
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= 1) return text;
  
  const naturalStarters = [
    'Honestly,', 'To be honest,', 'Frankly,', 
    'In my view,', 'The way I see it,', 'From my perspective,',
    'You know,', 'Actually,', 'Basically,', 'Essentially,',
    'Interestingly,', 'Surprisingly,', 'Notably,', 'Significantly,',
    'For instance,', 'Take, for example,', 'Consider,'
  ];
  
  let result = [];
  let usedStarters = new Set();
  
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i].trim();
    if (sentence.split(' ').length > 5) {
      if (i > 0 && Math.random() < 0.25) {
        let starter;
        let attempts = 0;
        do {
          starter = naturalStarters[Math.floor(Math.random() * naturalStarters.length)];
          attempts++;
        } while (usedStarters.has(starter) && attempts < 10);
        usedStarters.add(starter);
        sentence = starter + ' ' + sentence.charAt(0).toLowerCase() + sentence.slice(1);
        sentence = sentence.replace(/\.\./g, '.');
      }
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

// 7. Replace Generic Phrases with Specific Language
const makeMoreSpecific = (text: string): string => {
  const genericToSpecific: { [key: string]: string[] } = {
    'a lot': ['many', 'numerous', 'countless', 'a considerable number'],
    'a lot of': ['many', 'numerous', 'countless', 'a considerable number of'],
    'lots of': ['many', 'numerous', 'countless', 'a considerable number of'],
    'some': ['a few', 'several', 'various', 'a number of'],
    'stuff': ['things', 'items', 'elements', 'components', 'materials'],
    'things': ['items', 'elements', 'components', 'factors', 'aspects'],
    'nice': ['great', 'wonderful', 'excellent', 'remarkable', 'impressive'],
    'good': ['great', 'excellent', 'fine', 'superior', 'outstanding', 'exceptional'],
    'bad': ['poor', 'terrible', 'awful', 'inferior', 'substandard'],
    'big': ['large', 'great', 'huge', 'massive', 'enormous', 'substantial'],
    'small': ['little', 'tiny', 'compact', 'mini', 'petite', 'diminutive'],
    'important': ['key', 'critical', 'essential', 'vital', 'crucial', 'paramount'],
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

// ============ PRESERVE STRUCTURE HELPER - ENHANCED ============
// This function preserves paragraphs, line breaks, bullet points, headings, etc.
const preserveStructure = (text: string, humanizeFn: (line: string) => string): string => {
  // Split by paragraphs (double newline)
  const paragraphs = text.split(/\n\s*\n/);
  
  const processedParagraphs = paragraphs.map(paragraph => {
    // Split by lines within paragraph
    const lines = paragraph.split(/\n/);
    
    const processedLines = lines.map(line => {
      const leadingWhitespace = line.match(/^\s*/)?.[0] || '';
      const trailingWhitespace = line.match(/\s*$/)?.[0] || '';
      const content = line.trim();
      
      if (!content) return line; // Keep empty lines
      
      // Check for bullet points or numbered lists
      const bulletMatch = content.match(/^([•·▪◦●■□*\-+]|\d+[.)]|[a-zA-Z][.)])(\s+)/);
      if (bulletMatch) {
        const bullet = bulletMatch[1];
        const space = bulletMatch[2];
        const textContent = content.substring(bulletMatch[0].length);
        const humanizedContent = humanizeFn(textContent);
        return `${leadingWhitespace}${bullet}${space}${humanizedContent}${trailingWhitespace}`;
      }
      
      // Check for heading patterns
      const headingMatch = content.match(/^(#{1,6})\s+(.+)/);
      if (headingMatch) {
        const hashes = headingMatch[1];
        const headingText = headingMatch[2];
        const humanizedHeading = humanizeFn(headingText);
        return `${leadingWhitespace}${hashes} ${humanizedHeading}${trailingWhitespace}`;
      }
      
      // Check for checkbox/task list
      const checkboxMatch = content.match(/^(\s*)([-*+])\s+\[([ xX])\]\s+(.+)/);
      if (checkboxMatch) {
        const indent = checkboxMatch[1] || '';
        const marker = checkboxMatch[2];
        const checked = checkboxMatch[3];
        const textContent = checkboxMatch[4];
        const humanizedContent = humanizeFn(textContent);
        return `${indent}${marker} [${checked}] ${humanizedContent}`;
      }
      
      // Check for horizontal rule
      if (/^[-*_]{3,}$/.test(content)) {
        return content;
      }
      
      // Check for formatting (bold, italic)
      const formattingMatch = content.match(/^(\*{1,3}|_{1,3})(.+?)\1$/);
      if (formattingMatch) {
        const marker = formattingMatch[1];
        const textContent = formattingMatch[2];
        const humanizedContent = humanizeFn(textContent);
        return `${leadingWhitespace}${marker}${humanizedContent}${marker}${trailingWhitespace}`;
      }
      
      // Regular line - humanize the content
      const humanizedContent = humanizeFn(content);
      return `${leadingWhitespace}${humanizedContent}${trailingWhitespace}`;
    });
    
    return processedLines.join('\n');
  });
  
  // Join paragraphs with double newline to preserve paragraph breaks
  return processedParagraphs.join('\n\n');
};

// ============ WORD REPLACEMENT HELPER ============
const replaceWordsInLine = (line: string, rate: number): string => {
  const words = line.split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const cleanWord = words[i].toLowerCase().replace(/[^a-z]/g, '');
    // Skip words that are part of structure
    if (i === 0 && (line.trim().startsWith('#') || /^[•·▪◦●■□*\-+]|\d+[.)]|[a-zA-Z][.)]/.test(cleanWord))) {
      continue;
    }
    if (Math.random() < rate && hasReplacement(cleanWord)) {
      const replacement = getRandomReplacement(cleanWord);
      if (replacement) {
        const punctuation = words[i].match(/[^a-zA-Z]/g) || [];
        words[i] = replacement + (punctuation.join('') || '');
      }
    }
  }
  
  return words.join(' ');
};

// ============ LIGHT RESTRUCTURE FUNCTION ============
const lightRestructure = (sentence: string): string => {
  const words = sentence.split(' ');
  if (words.length > 6 && Math.random() < 0.5) {
    const moveCount = Math.floor(Math.random() * 2) + 1;
    const moved = words.splice(0, moveCount);
    words.push(...moved);
    return words.join(' ');
  }
  return sentence;
};

// ============ LIGHT HUMANIZATION ============
const applyLightHumanization = (text: string): string => {
  return preserveStructure(text, (line) => {
    if (!line.trim()) return line;
    let result = replaceWordsInLine(line, 0.55);
    result = simplifyVerbs(result);
    result = cutFiller(result);
    return result;
  });
};

// ============ MEDIUM HUMANIZATION ============
const applyMediumHumanization = (text: string): string => {
  return preserveStructure(text, (line) => {
    if (!line.trim()) return line;
    
    let result = replaceWordsInLine(line, 0.75);
    result = simplifyVerbs(result);
    result = cutFiller(result);
    result = removeAITransitions(result);
    
    if (Math.random() < 0.3) {
      result = lightRestructure(result);
    }
    
    return result;
  });
};

// ============ HEAVY RESTRUCTURING FUNCTIONS ============
const restructureSentenceHeavy = (sentence: string): string => {
  // Skip if it's a heading or bullet
  if (/^#{1,6}\s/.test(sentence) || /^[•·▪◦●■□*\-+]/.test(sentence)) {
    return sentence;
  }
  
  let result = sentence;
  const patterns = [
    {
      regex: /^(Because|Since|As|Given that)\s+(.+?),\s*(.+?)(\.|!|\?)/i,
      replacement: (m: RegExpMatchArray) => `${m[3]} ${m[1].toLowerCase()} ${m[2]}${m[4]}`
    },
    {
      regex: /^(.+?),\s*(although|though|while|whereas)\s+(.+?)(\.|!|\?)/i,
      replacement: (m: RegExpMatchArray) => `${m[2]} ${m[3]}, ${m[1]}${m[4]}`
    },
    {
      regex: /^If\s+(.+?),?\s+then?\s+(.+?)(\.|!|\?)/i,
      replacement: (m: RegExpMatchArray) => `${m[2]} if ${m[1]}${m[3]}`
    },
    {
      regex: /^When\s+(.+?),?\s+(.+?)(\.|!|\?)/i,
      replacement: (m: RegExpMatchArray) => `${m[2]} when ${m[1]}${m[3]}`
    },
    {
      regex: /^(.+?)\s+is\s+(.+?)(\.|!|\?)/i,
      replacement: (m: RegExpMatchArray) => `${m[2]} is what ${m[1]} is${m[3]}`
    },
    {
      regex: /^(.+?)\s+(does|did|will do)\s+(.+?)(\.|!|\?)/i,
      replacement: (m: RegExpMatchArray) => `What ${m[1]} ${m[2]} is ${m[3]}${m[4]}`
    }
  ];
  
  for (const pattern of patterns) {
    const match = result.match(pattern.regex);
    if (match) {
      return pattern.replacement(match);
    }
  }
  
  return result;
};

const changeVoiceHeavy = (sentence: string): string => {
  // Skip if it's a heading or bullet
  if (/^#{1,6}\s/.test(sentence) || /^[•·▪◦●■□*\-+]/.test(sentence)) {
    return sentence;
  }
  
  const activeSimple = sentence.match(/^(\w+)\s+(\w+[sd]?)\s+(\w+)(\.|!|\?)/i);
  if (activeSimple) {
    const subject = activeSimple[1];
    const verb = activeSimple[2];
    const object = activeSimple[3];
    const punct = activeSimple[4];
    
    let pastParticiple = verb;
    if (verb.endsWith('s')) pastParticiple = verb.slice(0, -1) + 'ed';
    else if (verb.endsWith('e')) pastParticiple = verb + 'd';
    else if (verb.endsWith('y') && !/[aeiou]/.test(verb[verb.length - 2])) pastParticiple = verb.slice(0, -1) + 'ied';
    else pastParticiple = verb + 'ed';
    
    return `The ${object} is ${pastParticiple} by ${subject}${punct}`;
  }
  
  const passiveMatch = sentence.match(/^The\s+(.+?)\s+is\s+(\w+ed)\s+by\s+(.+?)(\.|!|\?)/i);
  if (passiveMatch) {
    const object = passiveMatch[1];
    const verb = passiveMatch[2].replace(/ed$/, '');
    const subject = passiveMatch[3];
    const punct = passiveMatch[4];
    
    let presentVerb = verb;
    if (verb.endsWith('e')) presentVerb = verb + 's';
    else if (verb.endsWith('y') && !/[aeiou]/.test(verb[verb.length - 2])) presentVerb = verb.slice(0, -1) + 'ies';
    else presentVerb = verb + 's';
    
    return `${subject} ${presentVerb} the ${object}${punct}`;
  }
  
  return sentence;
};

// ============ HEAVY HUMANIZATION ============
const applyHeavyHumanization = (text: string): string => {
  return preserveStructure(text, (line) => {
    if (!line.trim()) return line;
    
    let result = replaceWordsInLine(line, 0.98);
    
    // Apply all natural language transformations
    result = removeAITransitions(result);
    result = simplifyVerbs(result);
    result = cutFiller(result);
    result = restructureSentenceHeavy(result);
    result = changeVoiceHeavy(result);
    result = mixSentenceLengths(result);
    result = varySentenceStarters(result);
    result = addNaturalContractions(result);
    result = makeMoreSpecific(result);
    
    return result;
  });
};

// ============ APPLY ALL GRAMMAR CORRECTIONS ============
const applyGrammarCorrections = (text: string): string => {
  let result = text;
  result = fixSubjectVerbAgreement(result);
  result = fixTenseConsistency(result);
  result = fixArticles(result);
  result = fixPrepositions(result);
  result = fixPronouns(result);
  result = fixDoubleNegatives(result);
  result = fixCapitalization(result);
  result = fixPunctuation(result);
  return result;
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
  
  switch (intensity) {
    case 'light':
      humanized = applyLightHumanization(text);
      changes = {
        sentencesRewritten: Math.floor(originalSentences * 0.4),
        wordsChanged: Math.floor(originalWords * 0.55),
      };
      break;
      
    case 'medium':
      humanized = applyMediumHumanization(text);
      changes = {
        sentencesRewritten: Math.floor(originalSentences * 0.7),
        wordsChanged: Math.floor(originalWords * 0.75),
      };
      break;
      
    case 'heavy':
      humanized = applyHeavyHumanization(text);
      changes = {
        sentencesRewritten: Math.floor(originalSentences * 0.95),
        wordsChanged: Math.floor(originalWords * 0.98),
      };
      break;
      
    default:
      humanized = text;
  }
  
  // Apply internal grammar corrections
  humanized = applyGrammarCorrections(humanized);
  
  // Apply LanguageTool API Grammar Check
  try {
    const language = tone === 'casual' ? 'en-US' : 'en-US';
    const grammarResult = await checkGrammarWithLanguageTool(humanized, language);
    
    if (grammarResult.matches && grammarResult.matches.length > 0) {
      humanized = applyGrammarAPICorrections(humanized, grammarResult.matches);
      changes.wordsChanged += grammarResult.matches.length;
    }
  } catch (error) {
    console.warn('LanguageTool API failed, using internal corrections only:', error);
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

// ============ HELPER GRAMMAR FUNCTIONS ============

const fixSubjectVerbAgreement = (text: string): string => {
  const patterns = [
    { regex: /\b(he|she|it|the\s+\w+)\s+(have)\b/gi, replacement: '$1 has' },
    { regex: /\b(he|she|it|the\s+\w+)\s+(do)\b/gi, replacement: '$1 does' },
    { regex: /\b(he|she|it|the\s+\w+)\s+(were)\b/gi, replacement: '$1 was' },
    { regex: /\b(he|she|it|the\s+\w+)\s+(are)\b/gi, replacement: '$1 is' },
    { regex: /\b(they|we|you|these|those|the\s+\w+s)\s+(has)\b/gi, replacement: '$1 have' },
    { regex: /\b(they|we|you|these|those|the\s+\w+s)\s+(does)\b/gi, replacement: '$1 do' },
    { regex: /\b(they|we|you|these|those|the\s+\w+s)\s+(was)\b/gi, replacement: '$1 were' },
    { regex: /\b(they|we|you|these|those|the\s+\w+s)\s+(is)\b/gi, replacement: '$1 are' },
  ];
  
  let result = text;
  for (const pattern of patterns) {
    result = result.replace(pattern.regex, pattern.replacement);
  }
  return result;
};

const fixTenseConsistency = (text: string): string => {
  const hasPastTense = /\b(was|were|had|did|[a-z]+ed)\b/i.test(text);
  const hasPresentTense = /\b(is|are|am|has|have|do|does|[a-z]+s)\b/i.test(text);
  
  let result = text;
  
  if (hasPastTense && hasPresentTense) {
    const pastCount = (text.match(/\b(was|were|had|did|[a-z]+ed)\b/gi) || []).length;
    const presentCount = (text.match(/\b(is|are|am|has|have|do|does|[a-z]+s)\b/gi) || []).length;
    
    if (pastCount > presentCount) {
      const presentToPast: { [key: string]: string } = {
        'is': 'was', 'are': 'were', 'am': 'was',
        'has': 'had', 'have': 'had',
        'do': 'did', 'does': 'did',
        'go': 'went', 'make': 'made', 'take': 'took',
        'give': 'gave', 'find': 'found', 'think': 'thought',
        'know': 'knew', 'see': 'saw', 'look': 'looked',
        'start': 'started', 'stop': 'stopped', 'change': 'changed',
        'help': 'helped', 'show': 'showed', 'need': 'needed',
        'want': 'wanted', 'work': 'worked', 'ask': 'asked',
        'tell': 'told', 'use': 'used', 'call': 'called',
        'try': 'tried', 'put': 'put', 'keep': 'kept',
        'leave': 'left', 'feel': 'felt', 'bring': 'brought',
        'begin': 'began', 'run': 'ran', 'stand': 'stood',
        'understand': 'understood', 'speak': 'spoke', 'break': 'broke',
        'come': 'came', 'draw': 'drew', 'eat': 'ate',
        'drink': 'drank', 'drive': 'drove', 'fly': 'flew',
        'grow': 'grew', 'meet': 'met', 'pay': 'paid',
        'read': 'read', 'ride': 'rode', 'ring': 'rang',
        'rise': 'rose', 'sing': 'sang', 'sit': 'sat',
        'spend': 'spent', 'spread': 'spread', 'steal': 'stole',
        'swim': 'swam', 'teach': 'taught', 'throw': 'threw',
        'wake': 'woke', 'write': 'wrote'
      };
      
      for (const [present, past] of Object.entries(presentToPast)) {
        const regex = new RegExp(`\\b${present}\\b`, 'gi');
        result = result.replace(regex, past);
      }
    }
  }
  return result;
};

const fixArticles = (text: string): string => {
  let result = text;
  result = result.replace(/\ba\s+([aeiouAEIOU][a-z]*)\b/g, 'an $1');
  result = result.replace(/\ba\s+(hour|honest|honor|heir|herb)/gi, 'an $1');
  result = result.replace(/\ban\s+([bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ][a-z]*)\b/g, 'a $1');
  result = result.replace(/\ban\s+(university|union|unicorn|uniform|united)/gi, 'a $1');
  return result;
};

const fixPrepositions = (text: string): string => {
  const corrections: { [key: string]: string } = {
    'different than': 'different from', 'different to': 'different from',
    'prior to': 'before', 'subsequent to': 'after',
    'in regards to': 'regarding', 'irregardless of': 'regardless of',
    'due to the fact that': 'because', 'in the event that': 'if',
    'at this point in time': 'now', 'for the purpose of': 'for',
    'in close proximity to': 'near', 'at the present time': 'now',
    'in the near future': 'soon', 'on a regular basis': 'regularly',
    'in a timely manner': 'promptly',
  };
  
  let result = text;
  for (const [incorrect, correct] of Object.entries(corrections)) {
    const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
    result = result.replace(regex, correct);
  }
  return result;
};

const fixPronouns = (text: string): string => {
  let result = text;
  result = result.replace(/\b(everyone|everybody|someone|somebody|anyone|anybody|no one|nobody)\s+(are)\b/gi, '$1 is');
  result = result.replace(/\b(everyone|everybody|someone|somebody|anyone|anybody|no one|nobody)\s+(have)\b/gi, '$1 has');
  result = result.replace(/\b(everyone|everybody|someone|somebody|anyone|anybody|no one|nobody)\s+(were)\b/gi, '$1 was');
  result = result.replace(/\b(everyone|everybody|someone|somebody|anyone|anybody|no one|nobody)\s+(do)\b/gi, '$1 does');
  return result;
};

const fixDoubleNegatives = (text: string): string => {
  const patterns = [
    { regex: /\b(no|not|never)\s+(nothing)\b/gi, replacement: 'anything' },
    { regex: /\b(no|not|never)\s+(nobody)\b/gi, replacement: 'anybody' },
    { regex: /\b(no|not|never)\s+(nowhere)\b/gi, replacement: 'anywhere' },
    { regex: /\b(no|not|never)\s+(none)\b/gi, replacement: 'any' },
    { regex: /\b(can't|cannot)\s+(never)\b/gi, replacement: 'can ever' },
    { regex: /\b(won't|will not)\s+(never)\b/gi, replacement: 'will ever' },
  ];
  
  let result = text;
  for (const pattern of patterns) {
    result = result.replace(pattern.regex, pattern.replacement);
  }
  return result;
};

const fixCapitalization = (text: string): string => {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.map((s, i) => {
    if (i === 0) return s.charAt(0).toUpperCase() + s.slice(1);
    if (s.length > 0 && !/^(i|a|an|the|and|or|but|for|nor|on|at|to|by|in|of|with|from|up|off|down|over|under|after|before|between|among|through|throughout|since|until|while|whereas|although|though|unless|because|as|if|whether|when|where|how|why|so|then|now|thus|hence|accordingly|consequently|furthermore|moreover|additionally|however|nevertheless|nonetheless|yet|still|therefore|thence|henceforth)\b/.test(s.split(' ')[0])) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    return s;
  }).join(' ');
};

const fixPunctuation = (text: string): string => {
  let result = text;
  result = result.replace(/\s{2,}/g, ' ');
  result = result.replace(/([.!?])([A-Za-z])/g, '$1 $2');
  result = result.replace(/([.!?])\1+/g, '$1');
  result = result.replace(/\s+([,.!?;:])/g, '$1');
  result = result.replace(/([a-zA-Z])\s+([a-zA-Z])\s+and\s+([a-zA-Z])/g, '$1, $2 and $3');
  if (result.length > 0 && !/[.!?]$/.test(result)) {
    result = result + '.';
  }
  return result;
};