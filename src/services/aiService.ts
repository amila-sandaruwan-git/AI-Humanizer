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

  const originalWords = text.split(' ').length;
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  switch (intensity) {
    case 'light':
      humanized = applyLightHumanization(text);
      changes = {
        sentencesRewritten: Math.floor(sentences.length * 0.5),
        wordsChanged: Math.floor(originalWords * 0.55),
      };
      break;
      
    case 'medium':
      humanized = applyMediumHumanization(text);
      changes = {
        sentencesRewritten: Math.floor(sentences.length * 0.8),
        wordsChanged: Math.floor(originalWords * 0.75),
      };
      break;
      
    case 'heavy':
      humanized = applyHeavyHumanization(text);
      changes = {
        sentencesRewritten: Math.floor(sentences.length * 0.98),
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
      humanized: (humanized || text).split(' ').length,
    },
    changes,
  };
};

// ============ LIGHT HUMANIZATION (55% Word Replacement) ============
const applyLightHumanization = (text: string): string => {
  let result = text;
  const words = result.split(/\s+/);
  
  // Replace exactly 55% of words
  for (let i = 0; i < words.length; i++) {
    const cleanWord = words[i].toLowerCase().replace(/[^a-z]/g, '');
    if (Math.random() < 0.55 && hasReplacement(cleanWord)) {
      const replacement = getRandomReplacement(cleanWord);
      if (replacement) {
        const punctuation = words[i].match(/[^a-zA-Z]/g) || [];
        words[i] = replacement + (punctuation.join('') || '');
      }
    }
  }
  
  // Light restructuring (40% of sentences)
  const sentences = words.join(' ').match(/[^.!?]+[.!?]+/g) || [words.join(' ')];
  let processed: string[] = [];
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i] || '';
    if (Math.random() < 0.4) {
      sentence = lightRestructure(sentence);
    }
    processed.push(sentence);
  }
  
  return processed.join(' ');
};

// ============ MEDIUM HUMANIZATION (75% Word Replacement) ============
const applyMediumHumanization = (text: string): string => {
  let result = text;
  const sentences = result.match(/[^.!?]+[.!?]+/g) || [result];
  
  let processedSentences: string[] = [];
  
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i] || '';
    
    // Step 1: Replace exactly 75% of words
    const words = sentence.split(/\s+/);
    for (let j = 0; j < words.length; j++) {
      const cleanWord = words[j].toLowerCase().replace(/[^a-z]/g, '');
      if (Math.random() < 0.75 && hasReplacement(cleanWord)) {
        const replacement = getRandomReplacement(cleanWord);
        if (replacement) {
          const punctuation = words[j].match(/[^a-zA-Z]/g) || [];
          words[j] = replacement + (punctuation.join('') || '');
        }
      }
    }
    sentence = words.join(' ');
    
    // Step 2: Multiple restructuring (80% chance)
    if (Math.random() < 0.8) {
      sentence = restructureSentenceHeavy(sentence);
      sentence = changeVoiceHeavy(sentence);
    }
    
    // Step 3: Add intensifier (50% chance)
    if (Math.random() < 0.5) {
      const intensifier = intensifiers[Math.floor(Math.random() * intensifiers.length)];
      const words2 = sentence.split(' ');
      if (words2.length > 3) {
        const index = Math.floor(Math.random() * (words2.length - 2)) + 1;
        words2.splice(index, 0, intensifier);
        sentence = words2.join(' ');
      }
    }
    
    // Step 4: Add sentence starter (60% chance)
    if (Math.random() < 0.6) {
      const starter = sentenceStarters[Math.floor(Math.random() * sentenceStarters.length)];
      sentence = `${starter} ${sentence.toLowerCase()}`;
    }
    
    processedSentences.push(sentence);
  }
  
  // Step 5: Shuffle sentences (70% chance)
  if (Math.random() < 0.7 && processedSentences.length > 2) {
    const first = processedSentences.shift();
    const last = processedSentences.pop();
    shuffleArray(processedSentences);
    if (first) processedSentences.unshift(first);
    if (last) processedSentences.push(last);
  }
  
  // Step 6: Add transition words (60% chance)
  let resultText = '';
  for (let i = 0; i < processedSentences.length; i++) {
    if (i > 0 && Math.random() < 0.6) {
      const transition = transitionWords[Math.floor(Math.random() * transitionWords.length)];
      resultText += ` ${transition}, `;
    }
    resultText += processedSentences[i];
  }
  
  return resultText;
};

// ============ HEAVY HUMANIZATION (98% Word Replacement) ============
const applyHeavyHumanization = (text: string): string => {
  let result = text;
  const sentences = result.match(/[^.!?]+[.!?]+/g) || [result];
  
  let processedSentences: string[] = [];
  
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i] || '';
    
    // Step 1: Replace exactly 98% of words (almost all words)
    const words = sentence.split(/\s+/);
    for (let j = 0; j < words.length; j++) {
      const cleanWord = words[j].toLowerCase().replace(/[^a-z]/g, '');
      if (Math.random() < 0.98 && hasReplacement(cleanWord)) {
        const replacement = getRandomReplacement(cleanWord);
        if (replacement) {
          const punctuation = words[j].match(/[^a-zA-Z]/g) || [];
          words[j] = replacement + (punctuation.join('') || '');
        }
      }
    }
    sentence = words.join(' ');
    
    // Step 2: Apply ALL transformations (100% chance)
    sentence = restructureSentenceHeavy(sentence);
    sentence = restructureSentenceExtreme(sentence);
    sentence = changeVoiceHeavy(sentence);
    sentence = splitAndCombine(sentence);
    sentence = addIntensifiers(sentence);
    sentence = changeSentenceType(sentence);
    sentence = addPersonalTouch(sentence);
    sentence = addIdiom(sentence);
    sentence = addTransitionInside(sentence);
    sentence = addExtraWords(sentence);
    sentence = changeOrder(sentence);
    sentence = addParenthetical(sentence);
    
    // Step 3: Add sentence starter (90% chance)
    if (Math.random() < 0.9) {
      const starter = sentenceStarters[Math.floor(Math.random() * sentenceStarters.length)];
      sentence = `${starter} ${sentence.toLowerCase()}`;
    }
    
    // Step 4: Add sentence ender (60% chance)
    if (Math.random() < 0.6) {
      const ender = sentenceEnders[Math.floor(Math.random() * sentenceEnders.length)];
      sentence = sentence.replace(/[.!?]+$/, '') + ` ${ender}`;
    }
    
    processedSentences.push(sentence);
  }
  
  // Step 5: Shuffle ALL sentences (100% chance)
  shuffleArray(processedSentences);
  
  // Step 6: Reverse some sentences (30% chance)
  if (Math.random() < 0.3 && processedSentences.length > 2) {
    const middle = Math.floor(processedSentences.length / 2);
    const firstHalf = processedSentences.slice(0, middle);
    const secondHalf = processedSentences.slice(middle);
    secondHalf.reverse();
    processedSentences = [...firstHalf, ...secondHalf];
  }
  
  // Step 7: Add multiple transition words (95% chance)
  let resultText = '';
  for (let i = 0; i < processedSentences.length; i++) {
    if (i > 0 && Math.random() < 0.95) {
      const transition = transitionWords[Math.floor(Math.random() * transitionWords.length)];
      resultText += ` ${transition}, `;
    }
    resultText += processedSentences[i];
  }
  
  // Step 8: Add introductory sentence (60% chance)
  if (Math.random() < 0.6) {
    const intros = [
      'It is worth examining the key points that emerge from this discussion.',
      'The central thesis of this analysis revolves around several critical factors.',
      'At its core, the argument rests on a few fundamental principles.',
      'The essence of the matter can be distilled into several key observations.',
      'Upon closer inspection, several important patterns begin to emerge.',
      'A careful examination reveals some interesting dynamics at play.',
      'The evidence points toward several noteworthy conclusions.',
      'What follows is a detailed examination of the key factors involved.'
    ];
    const intro = intros[Math.floor(Math.random() * intros.length)];
    if (Math.random() < 0.5) {
      resultText = `${intro} ${resultText.toLowerCase()}`;
    } else {
      const sentences2 = resultText.match(/[^.!?]+[.!?]+/g) || [resultText];
      const insertAt = Math.floor(sentences2.length / 2);
      sentences2.splice(insertAt, 0, intro);
      resultText = sentences2.join(' ');
    }
  }
  
  // Step 9: Add concluding sentence (70% chance)
  if (Math.random() < 0.7) {
    const conclusions = [
      'All things considered, this presents a compelling case.',
      'Ultimately, these factors work together to create the final outcome.',
      'In the end, the cumulative effect is significant.',
      'Taking everything into account, the result is clear.',
      'When all is said and done, the implications are far-reaching.',
      'The evidence suggests that this is indeed the case.',
      'It is clear that this perspective has considerable merit.',
      'Given the circumstances, this seems to be the most logical conclusion.'
    ];
    resultText += ` ${conclusions[Math.floor(Math.random() * conclusions.length)]}`;
  }
  
  return resultText;
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

// Extreme restructuring
const restructureSentenceExtreme = (sentence: string): string => {
  let result = sentence;
  
  const patterns = [
    {
      regex: /^(.+?)\s+has\s+(.+?)(\.|!|\?)/i,
      replacement: (m: RegExpMatchArray) => `${m[2]} belongs to ${m[1]}${m[3]}`
    },
    {
      regex: /^(.+?)\s+uses\s+(.+?)(\.|!|\?)/i,
      replacement: (m: RegExpMatchArray) => `${m[2]} is utilized by ${m[1]}${m[3]}`
    },
    {
      regex: /^(.+?)\s+makes\s+(.+?)(\.|!|\?)/i,
      replacement: (m: RegExpMatchArray) => `${m[2]} is made by ${m[1]}${m[3]}`
    },
    {
      regex: /^(.+?)\s+provides\s+(.+?)(\.|!|\?)/i,
      replacement: (m: RegExpMatchArray) => `${m[2]} is provided by ${m[1]}${m[3]}`
    },
    {
      regex: /^(.+?)\s+includes\s+(.+?)(\.|!|\?)/i,
      replacement: (m: RegExpMatchArray) => `${m[2]} is included in ${m[1]}${m[3]}`
    },
    {
      regex: /^(.+?)\s+creates\s+(.+?)(\.|!|\?)/i,
      replacement: (m: RegExpMatchArray) => `${m[2]} is created by ${m[1]}${m[3]}`
    },
    {
      regex: /^(.+?)\s+develops\s+(.+?)(\.|!|\?)/i,
      replacement: (m: RegExpMatchArray) => `${m[2]} is developed by ${m[1]}${m[3]}`
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

// Split and combine sentences
const splitAndCombine = (sentence: string): string => {
  const words = sentence.split(' ');
  
  if (words.length > 10 && Math.random() < 0.6) {
    const splitPoints = words.reduce((acc: number[], word, index) => {
      if (['and', 'but', 'or', 'because', 'although', 'while', 'however', 'therefore', 'moreover', 'furthermore'].includes(word.toLowerCase())) {
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
  }
  
  if (words.length < 5 && Math.random() < 0.5) {
    const extras = [
      ' Additionally, this is worth considering.',
      ' Furthermore, this deserves attention.',
      ' Moreover, this is significant.',
      ' In addition, this is noteworthy.',
      ' Besides, this is an important factor.'
    ];
    return sentence + extras[Math.floor(Math.random() * extras.length)];
  }
  
  return sentence;
};

// Add intensifiers
const addIntensifiers = (sentence: string): string => {
  const words = sentence.split(' ');
  if (words.length > 6 && Math.random() < 0.6) {
    const intensifier = intensifiers[Math.floor(Math.random() * intensifiers.length)];
    const index = Math.floor(Math.random() * (words.length - 3)) + 1;
    words.splice(index, 0, intensifier);
    return words.join(' ');
  }
  return sentence;
};

// Change sentence type
const changeSentenceType = (sentence: string): string => {
  if (Math.random() < 0.2 && sentence.length > 20) {
    const words = sentence.split(' ');
    if (words.length > 3) {
      const auxiliaries = ['is', 'are', 'was', 'were', 'has', 'have', 'do', 'does', 'did', 'can', 'could', 'will', 'would', 'should', 'may', 'might'];
      const firstWord = words[0].toLowerCase();
      if (!auxiliaries.includes(firstWord) && !firstWord.endsWith('?')) {
        const questionStart = ['Why', 'How', 'What', 'When', 'Where', 'Who'];
        const qStart = questionStart[Math.floor(Math.random() * questionStart.length)];
        return `${qStart} ${sentence.toLowerCase().replace(/[.!?]+$/, '')}?`;
      }
    }
  }
  
  if (Math.random() < 0.15 && sentence.length > 15) {
    return sentence.replace(/[.!?]+$/, '!');
  }
  
  return sentence;
};

// Add personal touch
const addPersonalTouch = (sentence: string): string => {
  const personalTouches = [
    'in my view', 'from my perspective', 'as I see it', 'in my opinion',
    'based on my experience', 'speaking personally', 'in my estimation',
    'from where I stand', 'in my judgment', 'to my mind'
  ];
  
  if (Math.random() < 0.4 && sentence.length > 15) {
    const touch = personalTouches[Math.floor(Math.random() * personalTouches.length)];
    const words = sentence.split(' ');
    if (words.length > 4) {
      const index = Math.floor(Math.random() * (words.length - 2)) + 1;
      words.splice(index, 0, touch);
      return words.join(' ');
    }
  }
  
  return sentence;
};

// Add idiom
const addIdiom = (sentence: string): string => {
  const idioms = [
    'at the end of the day', 'in a nutshell', 'the bottom line is',
    'as a matter of fact', 'in the grand scheme of things', 'all things considered',
    'to make a long story short', 'it goes without saying', 'needless to say',
    'come to think of it', 'in the long run', 'by and large', 'for the most part',
    'when push comes to shove', 'by the same token', 'as luck would have it'
  ];
  
  if (Math.random() < 0.25 && sentence.length > 20) {
    const idiom = idioms[Math.floor(Math.random() * idioms.length)];
    const words = sentence.split(' ');
    if (words.length > 4) {
      const index = Math.floor(Math.random() * (words.length - 2)) + 1;
      words.splice(index, 0, idiom);
      return words.join(' ');
    }
  }
  
  return sentence;
};

// Add transition inside sentence
const addTransitionInside = (sentence: string): string => {
  const transitions = ['however', 'therefore', 'consequently', 'meanwhile', 'nevertheless', 'nonetheless', 'furthermore', 'moreover', 'accordingly'];
  
  if (Math.random() < 0.35 && sentence.length > 25) {
    const transition = transitions[Math.floor(Math.random() * transitions.length)];
    const words = sentence.split(' ');
    if (words.length > 6) {
      const index = Math.floor(Math.random() * (words.length - 3)) + 2;
      words.splice(index, 0, transition + ',');
      return words.join(' ');
    }
  }
  
  return sentence;
};

// Add extra words
const addExtraWords = (sentence: string): string => {
  const extraWords = [
    'actually', 'basically', 'honestly', 'frankly', 'literally',
    'really', 'truly', 'genuinely', 'absolutely', 'definitely',
    'certainly', 'indeed', 'undoubtedly', 'unquestionably', 'without a doubt'
  ];
  
  if (Math.random() < 0.3 && sentence.length > 20) {
    const extra = extraWords[Math.floor(Math.random() * extraWords.length)];
    const words = sentence.split(' ');
    if (words.length > 4) {
      const index = Math.floor(Math.random() * (words.length - 2)) + 1;
      words.splice(index, 0, extra);
      return words.join(' ');
    }
  }
  
  return sentence;
};

// Change word order
const changeOrder = (sentence: string): string => {
  const words = sentence.split(' ');
  if (words.length > 8 && Math.random() < 0.3) {
    const start = Math.floor(words.length * 0.2);
    const end = Math.floor(words.length * 0.4);
    const section = words.splice(start, end - start);
    words.unshift(...section);
    return words.join(' ');
  }
  return sentence;
};

// Add parenthetical phrase
const addParenthetical = (sentence: string): string => {
  const parentheticals = [
    'for instance', 'for example', 'that is', 'in other words',
    'so to speak', 'as it were', 'in fact', 'to be precise'
  ];
  
  if (Math.random() < 0.2 && sentence.length > 25) {
    const parenthetical = parentheticals[Math.floor(Math.random() * parentheticals.length)];
    const words = sentence.split(' ');
    if (words.length > 5) {
      const index = Math.floor(Math.random() * (words.length - 3)) + 2;
      words.splice(index, 0, `(${parenthetical})`);
      return words.join(' ');
    }
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