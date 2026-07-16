// src/types/index.ts


export interface HumanizeRequest {
  text: string;
  tone?: 'professional' | 'casual' | 'academic' | 'creative';
  style?: 'concise' | 'detailed' | 'balanced';
  intensity?: 'light' | 'medium' | 'heavy';
}

export interface HumanizeResponse {
  original: string;
  humanized: string;
  wordCount: {
    original: number;
    humanized: number;
  };
  changes?: {
    sentencesRewritten: number;
    wordsChanged: number;
  };
}

export type ToneType = 'professional' | 'casual' | 'academic' | 'creative';
export type StyleType = 'concise' | 'detailed' | 'balanced';
export type IntensityType = 'light' | 'medium' | 'heavy';