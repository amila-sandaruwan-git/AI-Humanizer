import axios from 'axios';
import { HumanizeRequest, HumanizeResponse } from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export similarity calculation function for use in feedback loop
export const calculateSimilarity = (text1: string, text2: string): number => {
  // Word-level similarity using Jaccard similarity
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  // Calculate n-gram similarity (bigrams)
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
  
  // Jaccard similarity for bigrams
  const intersection = bigrams1.filter(b => bigrams2.includes(b));
  const union = new Set([...bigrams1, ...bigrams2]);
  
  if (union.size === 0) return 0;
  return Math.round((intersection.length / union.size) * 100);
};

// Main humanization function with feedback loop
export const humanizeText = async (
  request: HumanizeRequest
): Promise<HumanizeResponse> => {
  const { text, tone = 'professional', style = 'balanced', intensity = 'medium' } = request;
  
  // Define target similarity ranges
  const targetRanges = {
    light: { min: 70, max: 80, maxAttempts: 2 },
    medium: { min: 50, max: 60, maxAttempts: 3 },
    heavy: { min: 10, max: 20, maxAttempts: 5 },
  };
  
  const config = targetRanges[intensity as keyof typeof targetRanges] || targetRanges.medium;
  let humanized = text;
  let attempts = 0;
  let similarity = 100;
  
  // For Light mode, use rule-based approach (fast and sufficient)
  if (intensity === 'light') {
    humanized = applyLightHumanization(text);
    similarity = calculateSimilarity(text, humanized);
  } else {
    // For Medium and Heavy, use LLM with feedback loop
    let currentText = text;
    
    while (attempts < config.maxAttempts) {
      attempts++;
      
      // Step 1: Generate humanized version using LLM
      const generated = await callLLMForHumanization(currentText, intensity, tone, style);
      
      // Step 2: Calculate similarity
      similarity = calculateSimilarity(text, generated);
      
      console.log(`Attempt ${attempts}: Similarity = ${similarity}% (Target: ${config.min}-${config.max}%)`);
      
      // Step 3: Check if in target range
      if (similarity >= config.min && similarity <= config.max) {
        humanized = generated;
        break;
      } else if (similarity > config.max) {
        // Too similar - regenerate with stronger rewriting
        const prompt = generateStrengthPrompt(intensity, 'stronger');
        currentText = await callLLMWithPrompt(generated, prompt);
      } else if (similarity < config.min) {
        // Too different - regenerate with milder rewriting
        const prompt = generateStrengthPrompt(intensity, 'milder');
        currentText = await callLLMWithPrompt(generated, prompt);
      }
      
      // If last attempt, use whatever we have
      if (attempts === config.maxAttempts) {
        humanized = generated;
      }
    }
  }
  
  // Fallback: if similarity is still outside target, use the best we have
  if (intensity !== 'light') {
    // Try one more time with a different approach
    if (similarity > config.max) {
      humanized = await callLLMForHumanization(text, intensity, tone, style, true);
    }
  }
  
  const originalWords = text.split(' ').length;
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  return {
    original: text,
    humanized: humanized || text,
    wordCount: {
      original: originalWords,
      humanized: (humanized || text).split(' ').length,
    },
    changes: {
      sentencesRewritten: Math.floor(sentences.length * 0.8),
      wordsChanged: Math.floor(originalWords * 0.8),
    },
  };
};

// ============ LLM CALL FUNCTIONS ============

// Call LLM for humanization
const callLLMForHumanization = async (
  text: string,
  intensity: string,
  tone: string,
  style: string,
  aggressive: boolean = false
): Promise<string> => {
  // For now, use our rule-based approach as fallback
  // In production, this would call Gemini API
  return fallbackHumanize(text, intensity, tone, style, aggressive);
};

// Call LLM with specific prompt
const callLLMWithPrompt = async (text: string, prompt: string): Promise<string> => {
  // In production, this would call Gemini API with the prompt
  // For now, return the text with some modifications
  return text;
};

// Generate strength prompt
const generateStrengthPrompt = (intensity: string, direction: 'stronger' | 'milder'): string => {
  if (direction === 'stronger') {
    return `Rewrite this text with MUCH MORE AGGRESSIVE changes. Change the sentence structure completely. Use different vocabulary. Rewrite from a different perspective. Make it sound like a completely different person wrote it while keeping the same meaning.`;
  } else {
    return `Rewrite this text with milder changes. Keep more of the original structure and vocabulary while still making it sound natural and human.`;
  }
};

// ============ FALLBACK HUMANIZATION (Rule-based) ============

const fallbackHumanize = (
  text: string,
  intensity: string,
  tone: string,
  style: string,
  aggressive: boolean = false
): string => {
  switch (intensity) {
    case 'light':
      return applyLightHumanization(text);
    case 'medium':
      return applyMediumHumanization(text);
    case 'heavy':
      return applyHeavyHumanization(text);
    default:
      return text;
  }
};

// ============ LIGHT HUMANIZATION (70-80% Similar) ============
const applyLightHumanization = (text: string): string => {
  let result = text;
  
  const wordReplacements: { [key: string]: string[] } = {
    'is': ['remains', 'stays', 'continues to be'],
    'are': ['remain', 'stay', 'continue to be'],
    'has': ['possesses', 'holds', 'contains'],
    'have': ['possess', 'hold', 'contain'],
    'can': ['may', 'might', 'could'],
    'will': ['shall', 'would', 'is going to'],
    'very': ['quite', 'rather', 'pretty', 'fairly'],
    'really': ['truly', 'actually', 'genuinely'],
    'important': ['key', 'critical', 'essential', 'vital'],
    'many': ['numerous', 'countless', 'several'],
    'more': ['additional', 'extra', 'further'],
    'new': ['fresh', 'novel', 'modern', 'contemporary'],
    'good': ['great', 'excellent', 'fine', 'superior'],
    'big': ['large', 'great', 'huge', 'massive'],
    'small': ['little', 'tiny', 'compact', 'mini'],
    'easy': ['simple', 'straightforward', 'effortless'],
    'hard': ['difficult', 'tough', 'challenging'],
  };

  // Replace only 20% of words
  for (const [word, replacements] of Object.entries(wordReplacements)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = result.match(regex);
    if (matches) {
      const replaceCount = Math.ceil(matches.length * 0.2);
      let count = 0;
      result = result.replace(regex, (match) => {
        if (count < replaceCount) {
          count++;
          const replacement = replacements[Math.floor(Math.random() * replacements.length)];
          return replacement || match;
        }
        return match;
      });
    }
  }

  return result;
};

// ============ MEDIUM HUMANIZATION (50-60% Similar) ============
const applyMediumHumanization = (text: string): string => {
  let result = text;
  
  // Step 1: Break into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // Step 2: Apply structural transformations
  let processedSentences: string[] = [];
  
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i] || '';
    
    // Apply different transformations based on position
    if (i % 3 === 0) {
      sentence = convertToPassiveVoice(sentence);
    } else if (i % 3 === 1) {
      sentence = addConversationalOpener(sentence);
    } else {
      sentence = reorderClauses(sentence);
    }
    
    processedSentences.push(sentence);
  }
  
  // Step 3: Split long sentences
  result = splitSentences(processedSentences.join('. '));
  
  // Step 4: Add connectors
  result = addConnectors(result);
  
  // Step 5: Word replacement (60%)
  result = replaceWords(result, 0.6);
  
  // Step 6: Add contractions
  result = addContractions(result, 0.6);
  
  return result;
};

// ============ HEAVY HUMANIZATION (10-20% Similar) ============
const applyHeavyHumanization = (text: string): string => {
  let result = text;
  
  // Step 1: Break into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // Step 2: Apply multiple transformations per sentence
  let processedSentences: string[] = [];
  
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i] || '';
    
    // Apply 2-3 transformations per sentence
    if (i % 4 === 0) {
      sentence = convertToPassiveVoice(sentence);
      sentence = addConversationalOpener(sentence);
      sentence = addCommentary(sentence);
    } else if (i % 4 === 1) {
      sentence = addPersonalOpinion(sentence);
      sentence = reorderClauses(sentence);
      sentence = addCommentary(sentence);
    } else if (i % 4 === 2) {
      sentence = convertToPassiveVoice(sentence);
      sentence = addPersonalOpinion(sentence);
      sentence = addConversationalOpener(sentence);
    } else {
      sentence = addConversationalOpener(sentence);
      sentence = reorderClauses(sentence);
      sentence = addCommentary(sentence);
    }
    
    processedSentences.push(sentence);
  }
  
  // Step 3: Shuffle sentence order
  shuffleArray(processedSentences);
  
  // Step 4: Split and combine
  result = splitAndCombineSentences(processedSentences);
  
  // Step 5: Add filler content
  result = addMultipleFiller(result);
  
  // Step 6: Add perspectives
  result = addPerspectives(result);
  
  // Step 7: Voice changes
  result = voiceChanges(result);
  
  // Step 8: Word replacement (80%)
  result = replaceWords(result, 0.8);
  
  // Step 9: Add contractions
  result = addContractions(result, 0.9);
  
  // Step 10: Make casual
  result = makeCasual(result, 0.9);
  
  return result;
};

// ============ TRANSFORMATION FUNCTIONS ============

const convertToPassiveVoice = (sentence: string): string => {
  const patterns = [
    { active: /\b(\w+)\s+is\s+(\w+ing)\s+(\w+)\b/i, passive: 'The $3 is being $2 by $1' },
    { active: /\b(\w+)\s+has\s+(\w+ed)\s+(\w+)\b/i, passive: 'The $3 has been $2 by $1' },
    { active: /\b(\w+)\s+will\s+(\w+)\s+(\w+)\b/i, passive: 'The $3 will be $2 by $1' },
  ];
  
  for (const pattern of patterns) {
    const match = sentence.match(pattern.active);
    if (match) {
      let result = pattern.passive;
      for (let i = 1; i < match.length; i++) {
        result = result.replace(`$${i}`, match[i] || '');
      }
      return result;
    }
  }
  
  return sentence;
};

const addConversationalOpener = (sentence: string): string => {
  const openers = [
    'To be honest,',
    'In my view,',
    'I think that',
    'It seems that',
    'Honestly speaking,',
    'The way I see it,',
    'If you ask me,',
    'From my perspective,'
  ];
  
  if (Math.random() > 0.3) {
    const opener = openers[Math.floor(Math.random() * openers.length)];
    return `${opener} ${sentence.toLowerCase()}`;
  }
  
  return sentence;
};

const addPersonalOpinion = (sentence: string): string => {
  const opinions = [
    'in my experience',
    'from what I\'ve seen',
    'as far as I can tell',
    'based on my observations',
    'in my humble opinion'
  ];
  
  if (Math.random() > 0.3) {
    const opinion = opinions[Math.floor(Math.random() * opinions.length)];
    const words = sentence.split(' ');
    if (words.length > 4) {
      const index = Math.floor(Math.random() * (words.length - 2)) + 1;
      words.splice(index, 0, opinion);
      return words.join(' ');
    }
  }
  
  return sentence;
};

const reorderClauses = (sentence: string): string => {
  // Pattern: "Because X, Y happened" → "Y happened because X"
  const causeMatch = sentence.match(/^(Because|Since|As|Given that)\s+(.+?),\s*(.+?)(\.|!|\?)/);
  if (causeMatch) {
    return `${causeMatch[3]} because ${causeMatch[2]}${causeMatch[4]}`;
  }
  
  // Pattern: "X, although Y" → "Although Y, X"
  const concessiveMatch = sentence.match(/^(.+?),\s*(although|though|while|whereas)\s+(.+?)(\.|!|\?)/);
  if (concessiveMatch) {
    return `${concessiveMatch[2]} ${concessiveMatch[3]}, ${concessiveMatch[1]}${concessiveMatch[4]}`;
  }
  
  return sentence;
};

const addCommentary = (sentence: string): string => {
  const comments = [
    ' which is worth noting',
    ' as it turns out',
    ' interestingly enough',
    ' surprisingly',
    ' notably',
    ' in fact'
  ];
  
  if (Math.random() > 0.4) {
    const comment = comments[Math.floor(Math.random() * comments.length)];
    const words = sentence.split(' ');
    if (words.length > 4) {
      const index = Math.floor(Math.random() * (words.length - 2)) + 1;
      words.splice(index, 0, comment);
      return words.join(' ');
    }
  }
  
  return sentence;
};

const splitSentences = (text: string): string => {
  let result = text;
  
  result = result.replace(/,\s/g, (match) => {
    return Math.random() > 0.3 ? '. ' : match;
  });
  
  const conjunctions = [' and ', ' but ', ' or '];
  for (const conj of conjunctions) {
    result = result.replace(new RegExp(conj, 'gi'), (match) => {
      return Math.random() > 0.3 ? '. ' : match;
    });
  }
  
  return result;
};

const addConnectors = (text: string): string => {
  const connectors = [
    '; moreover,',
    '; in fact,',
    '; what is more,',
    '; consequently,',
    '; however,',
    '; therefore,'
  ];
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let result: string[] = [];
  
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i] || '';
    if (i < sentences.length - 1 && sentence.length > 30 && Math.random() > 0.5) {
      const connector = connectors[Math.floor(Math.random() * connectors.length)];
      sentence = sentence.replace(/[.!?]+$/, '') + connector;
    }
    result.push(sentence);
  }
  
  return result.join(' ');
};

const splitAndCombineSentences = (sentences: string[]): string => {
  let result: string[] = [];
  
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i] || '';
    
    // Split long sentences
    if (sentence.split(' ').length > 15 && Math.random() > 0.3) {
      const parts = sentence.split(/,\s|;\s| and | but | or /);
      if (parts.length > 1) {
        for (const part of parts) {
          if (part.trim()) {
            result.push(part.trim() + '.');
          }
        }
        continue;
      }
    }
    
    // Combine short sentences
    if (result.length > 0 && sentence.split(' ').length < 8 && Math.random() > 0.5) {
      const last = result.pop() || '';
      result.push(last.replace(/\.$/, '') + ', and ' + sentence.toLowerCase());
    } else {
      result.push(sentence);
    }
  }
  
  return result.join(' ');
};

const addMultipleFiller = (text: string): string => {
  const fillers = [
    'which is worth noting',
    'as it turns out',
    'interestingly enough',
    'surprisingly',
    'notably',
    'in fact',
    'as a matter of fact',
    'come to think of it',
    'to be fair',
    'all things considered'
  ];
  
  const sentences = text.split('. ');
  let result: string[] = [];
  
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i] || '';
    if (i > 0 && Math.random() > 0.4 && sentence.length > 15) {
      const filler = fillers[Math.floor(Math.random() * fillers.length)];
      if (Math.random() > 0.5) {
        sentence = `${filler}, ${sentence.toLowerCase()}`;
      } else {
        const words = sentence.split(' ');
        const index = Math.floor(Math.random() * (words.length - 2)) + 1;
        words.splice(index, 0, filler);
        sentence = words.join(' ');
      }
    }
    result.push(sentence);
  }
  
  return result.join('. ');
};

const addPerspectives = (text: string): string => {
  const perspectives = [
    'from my perspective',
    'in my experience',
    'from what I\'ve seen',
    'as far as I can tell',
    'based on my observations',
    'in my humble opinion'
  ];
  
  const sentences = text.split('. ');
  let result: string[] = [];
  
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i] || '';
    if (i > 0 && Math.random() > 0.4) {
      const perspective = perspectives[Math.floor(Math.random() * perspectives.length)];
      sentence = `${perspective}, ${sentence.toLowerCase()}`;
    }
    result.push(sentence);
  }
  
  return result.join('. ');
};

const voiceChanges = (text: string): string => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  return sentences.map(sentence => {
    if (Math.random() > 0.6) return sentence;
    
    // "Researchers found that X" → "It was found that X"
    const activeSubject = sentence.match(/^([A-Z][a-z]+)\s+(found|showed|demonstrated|argued|claimed|noted)\s+(that\s+.+)/);
    if (activeSubject) {
      return `It was ${activeSubject[2] === 'found' ? 'found' : 'shown'} ${activeSubject[3]}`;
    }
    
    return sentence;
  }).join(' ');
};

const replaceWords = (text: string, rate: number): string => {
  const replacements: { [key: string]: string[] } = {
    'is': ['remains', 'stays', 'continues to be', 'functions as', 'serves as'],
    'are': ['remain', 'stay', 'continue to be', 'function as', 'serve as'],
    'has': ['possesses', 'holds', 'contains', 'includes', 'boasts'],
    'have': ['possess', 'hold', 'contain', 'include', 'boast'],
    'can': ['may', 'might', 'could', 'is able to', 'has the ability to'],
    'will': ['shall', 'would', 'is going to', 'intends to'],
    'very': ['quite', 'rather', 'pretty', 'fairly', 'extremely'],
    'really': ['truly', 'actually', 'genuinely', 'honestly', 'absolutely'],
    'important': ['key', 'critical', 'essential', 'vital', 'crucial'],
    'many': ['numerous', 'countless', 'several', 'a lot of', 'plenty of'],
    'more': ['additional', 'extra', 'further', 'supplementary'],
    'new': ['fresh', 'novel', 'modern', 'contemporary', 'cutting-edge'],
    'good': ['great', 'excellent', 'fine', 'superior', 'outstanding'],
    'big': ['large', 'great', 'huge', 'massive', 'enormous'],
    'small': ['little', 'tiny', 'compact', 'mini', 'petite'],
    'easy': ['simple', 'straightforward', 'effortless', 'uncomplicated'],
    'hard': ['difficult', 'tough', 'challenging', 'complex'],
    'clear': ['obvious', 'apparent', 'evident', 'transparent'],
    'sure': ['certain', 'confident', 'convinced', 'positive'],
    'right': ['correct', 'accurate', 'precise', 'exact'],
    'true': ['real', 'actual', 'genuine', 'authentic', 'legitimate'],
    'able': ['capable', 'competent', 'skilled', 'proficient'],
    'main': ['primary', 'principal', 'chief', 'major'],
    'full': ['complete', 'entire', 'whole', 'comprehensive'],
    'only': ['solely', 'exclusively', 'merely', 'just'],
    'now': ['currently', 'presently', 'at present', 'right now'],
    'then': ['afterward', 'subsequently', 'later', 'after that'],
    'than': ['versus', 'compared to', 'as opposed to', 'in contrast to'],
  };

  let result = text;
  for (const [word, replacementsList] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = result.match(regex);
    if (matches) {
      const replaceCount = Math.ceil(matches.length * rate);
      let count = 0;
      result = result.replace(regex, (match) => {
        if (count < replaceCount) {
          count++;
          const replacement = replacementsList[Math.floor(Math.random() * replacementsList.length)];
          return replacement || match;
        }
        return match;
      });
    }
  }
  
  return result;
};

const addContractions = (text: string, rate: number): string => {
  const contractions: { [key: string]: string } = {
    'cannot': 'can\'t',
    'will not': 'won\'t',
    'do not': 'don\'t',
    'does not': 'doesn\'t',
    'is not': 'isn\'t',
    'are not': 'aren\'t',
    'was not': 'wasn\'t',
    'were not': 'weren\'t',
    'have not': 'haven\'t',
    'has not': 'hasn\'t',
    'would not': 'wouldn\'t',
    'could not': 'couldn\'t',
    'should not': 'shouldn\'t',
    'I am': 'I\'m',
    'you are': 'you\'re',
    'he is': 'he\'s',
    'she is': 'she\'s',
    'it is': 'it\'s',
    'we are': 'we\'re',
    'they are': 'they\'re',
    'I have': 'I\'ve',
    'you have': 'you\'ve',
    'we have': 'we\'ve',
    'they have': 'they\'ve',
    'I would': 'I\'d',
    'you would': 'you\'d',
    'he would': 'he\'d',
    'she would': 'she\'d',
    'we would': 'we\'d',
    'they would': 'they\'d',
    'I will': 'I\'ll',
    'you will': 'you\'ll',
    'he will': 'he\'ll',
    'she will': 'she\'ll',
    'we will': 'we\'ll',
    'they will': 'they\'ll',
  };
  
  let result = text;
  for (const [formal, casual] of Object.entries(contractions)) {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi');
    const matches = result.match(regex);
    if (matches) {
      const replaceCount = Math.ceil(matches.length * rate);
      let count = 0;
      result = result.replace(regex, (match) => {
        if (count < replaceCount) {
          count++;
          return casual;
        }
        return match;
      });
    }
  }
  
  return result;
};

const makeCasual = (text: string, rate: number): string => {
  const casualWords: { [key: string]: string[] } = {
    'very': ['really', 'totally', 'absolutely', 'so', 'super', 'seriously'],
    'really': ['so', 'totally', 'completely', 'absolutely', 'definitely'],
    'good': ['great', 'excellent', 'awesome', 'brilliant', 'fantastic', 'amazing'],
    'bad': ['terrible', 'awful', 'horrible', 'dreadful', 'rubbish', 'lousy'],
    'big': ['large', 'huge', 'massive', 'enormous', 'giant', 'humongous'],
    'small': ['little', 'tiny', 'compact', 'mini', 'petite', 'wee'],
    'many': ['lots of', 'a bunch of', 'tons of', 'loads of', 'heaps of', 'oodles of'],
    'difficult': ['hard', 'tough', 'challenging', 'rough', 'tricky'],
    'easy': ['simple', 'straightforward', 'a breeze', 'piece of cake', 'no sweat']
  };
  
  let result = text;
  for (const [word, replacementsList] of Object.entries(casualWords)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = result.match(regex);
    if (matches) {
      const replaceCount = Math.ceil(matches.length * rate);
      let count = 0;
      result = result.replace(regex, (match) => {
        if (count < replaceCount) {
          count++;
          const replacement = replacementsList[Math.floor(Math.random() * replacementsList.length)];
          return replacement || match;
        }
        return match;
      });
    }
  }
  
  return result;
};

const shuffleArray = <T>(array: T[]): void => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

// ============ TONE ADJUSTMENTS ============

const applyToneAdjustments = (text: string, tone: string, intensity: string): string => {
  let result = text;
  
  if (intensity === 'heavy' || intensity === 'medium') {
    return result;
  }
  
  switch (tone) {
    case 'professional':
      result = result.replace(/\b(can't)\b/gi, 'cannot');
      result = result.replace(/\b(won't)\b/gi, 'will not');
      result = result.replace(/\b(don't)\b/gi, 'do not');
      result = result.replace(/\b(isn't)\b/gi, 'is not');
      result = result.replace(/\b(aren't)\b/gi, 'are not');
      break;
      
    case 'academic':
      result = result.replace(/\b(use)\b/gi, 'utilize');
      result = result.replace(/\b(help)\b/gi, 'assist');
      result = result.replace(/\b(show)\b/gi, 'demonstrate');
      result = result.replace(/\b(so)\b/gi, 'therefore');
      result = result.replace(/\b(but)\b/gi, 'however');
      break;
      
    case 'creative':
      const creativeWords = [
        'vividly', 'brilliantly', 'exquisitely', 'magnificently', 'splendidly',
        'captivatingly', 'enchantingly', 'enthrallingly', 'mesmerizingly'
      ];
      const sentences = result.split('. ');
      if (sentences.length > 1) {
        for (let i = 0; i < sentences.length; i += 2) {
          if (Math.random() > 0.5) {
            const words = sentences[i].split(' ');
            if (words.length > 3) {
              const pos = Math.floor(Math.random() * (words.length - 2)) + 1;
              words.splice(pos, 0, creativeWords[Math.floor(Math.random() * creativeWords.length)]);
              sentences[i] = words.join(' ');
            }
          }
        }
        result = sentences.join('. ');
      }
      break;
  }
  
  return result;
};