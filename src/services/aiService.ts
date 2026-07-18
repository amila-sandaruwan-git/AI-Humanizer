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

// Main humanization function
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
  
  switch (intensity) {
    case 'light':
      humanized = applyLightHumanization(text);
      changes = {
        sentencesRewritten: 0,
        wordsChanged: Math.floor(originalWords * 0.55),
      };
      break;
      
    case 'medium':
      humanized = applyMediumHumanization(text);
      changes = {
        sentencesRewritten: 0,
        wordsChanged: Math.floor(originalWords * 0.75),
      };
      break;
      
    case 'heavy':
      humanized = applyHeavyHumanization(text);
      changes = {
        sentencesRewritten: 0,
        wordsChanged: Math.floor(originalWords * 0.98),
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
      humanized: (humanized || text).split(/\s+/).length,
    },
    changes,
  };
};

// ============ PRESERVE STRUCTURE HELPER ============
// This function preserves the original text structure while humanizing content
const preserveStructure = (text: string, humanizeFn: (line: string) => string): string => {
  // Split by lines to preserve line breaks
  const lines = text.split(/\n/);
  
  const processedLines = lines.map(line => {
    // Check if line is a bullet point or has special formatting
    const bulletMatch = line.match(/^(\s*)([•·▪◦●■□*\-+]|\d+[.)]|[a-zA-Z][.)])(\s+)/);
    
    if (bulletMatch) {
      // This is a bullet point - preserve the bullet format
      const indent = bulletMatch[1] || '';
      const bullet = bulletMatch[2] || '';
      const space = bulletMatch[3] || '';
      const content = line.substring(bulletMatch[0].length);
      
      // Humanize the content only, preserve the bullet
      const humanizedContent = humanizeFn(content);
      return `${indent}${bullet}${space}${humanizedContent}`;
    } else {
      // Regular line - humanize the entire line
      return humanizeFn(line);
    }
  });
  
  return processedLines.join('\n');
};

// ============ WORD REPLACEMENT HELPER ============
const replaceWordsInLine = (line: string, rate: number): string => {
  const words = line.split(/\s+/);
  let changed = 0;
  
  for (let i = 0; i < words.length; i++) {
    const cleanWord = words[i].toLowerCase().replace(/[^a-z]/g, '');
    if (Math.random() < rate && hasReplacement(cleanWord)) {
      const replacement = getRandomReplacement(cleanWord);
      if (replacement) {
        const punctuation = words[i].match(/[^a-zA-Z]/g) || [];
        words[i] = replacement + (punctuation.join('') || '');
        changed++;
      }
    }
  }
  
  return words.join(' ');
};

// ============ LIGHT HUMANIZATION (55% Word Replacement) ============
const applyLightHumanization = (text: string): string => {
  return preserveStructure(text, (line) => {
    if (!line.trim()) return line;
    return replaceWordsInLine(line, 0.55);
  });
};

// ============ MEDIUM HUMANIZATION (75% Word Replacement) ============
const applyMediumHumanization = (text: string): string => {
  return preserveStructure(text, (line) => {
    if (!line.trim()) return line;
    
    let result = replaceWordsInLine(line, 0.75);
    
    // Light restructuring on the line (30% chance)
    if (Math.random() < 0.3) {
      result = lightRestructure(result);
    }
    
    return result;
  });
};

// ============ HEAVY HUMANIZATION (98% Word Replacement) ============
const applyHeavyHumanization = (text: string): string => {
  return preserveStructure(text, (line) => {
    if (!line.trim()) return line;
    
    let result = replaceWordsInLine(line, 0.98);
    
    // Apply heavier restructuring
    result = restructureSentenceHeavy(result);
    result = changeVoiceHeavy(result);
    
    return result;
  });
};

// ============ RESTRUCTURE FUNCTIONS ============

// Light restructuring
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

// Heavy restructuring
const restructureSentenceHeavy = (sentence: string): string => {
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

// Change voice
const changeVoiceHeavy = (sentence: string): string => {
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

// ============ UTILITY FUNCTIONS ============

const shuffleArray = <T>(array: T[]): void => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};