// src/services/aiService.ts

import axios from 'axios';
import { HumanizeRequest, HumanizeResponse } from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Local implementation using browser's AI API (if available)
export const humanizeWithBrowserAI = async (
  text: string,
  tone: string = 'professional'
): Promise<string> => {
  // Check if Chrome's built-in AI is available
  if ('ai' in window && (window as any).ai?.rewriter) {
    try {
      const rewriter = await (window as any).ai.rewriter.create({
        tone: tone === 'professional' ? 'formal' : 
              tone === 'casual' ? 'informal' : 
              'balanced',
        length: 'as-is'
      });
      const result = await rewriter.rewrite(text);
      return result;
    } catch (error) {
      console.error('Browser AI failed, falling back to API:', error);
      throw error;
    }
  }
  throw new Error('Browser AI not available');
};

// API-based humanization (for production)
export const humanizeWithAPI = async (
  request: HumanizeRequest
): Promise<HumanizeResponse> => {
  try {
    const response = await api.post('/humanize', request);
    return response.data;
  } catch (error) {
    console.error('API Humanization failed:', error);
    // Fallback to local simulation
    return simulateHumanization(request);
  }
};

// Fallback simulation (for demo purposes)
const simulateHumanization = (request: HumanizeRequest): HumanizeResponse => {
  const { text, tone = 'professional', style = 'balanced' } = request;
  
  // Simulate humanization by slightly modifying the text
  const humanized = text
    .replace(/\b(utilize)\b/g, 'use')
    .replace(/\b(commence)\b/g, 'start')
    .replace(/\b(terminate)\b/g, 'end')
    .replace(/\b(sufficient)\b/g, 'enough')
    .replace(/\b(additional)\b/g, 'extra')
    .replace(/\b(purchase)\b/g, 'buy')
    .replace(/\b(assist)\b/g, 'help');
  
  // Add varied sentence structure (simplified simulation)
  const sentences = humanized.split('. ');
  const varied = sentences.map((s, i) => {
    if (i % 2 === 0) return s;
    return s.replace(/\b(and|but|or)\b/g, (match) => {
      const options = ['plus', 'yet', 'while', 'though', 'whereas'];
      return options[Math.floor(Math.random() * options.length)];
    });
  }).join('. ');
  
  return {
    original: text,
    humanized: varied,
    wordCount: {
      original: text.split(' ').length,
      humanized: varied.split(' ').length,
    },
    changes: {
      sentencesRewritten: Math.floor(sentences.length * 0.3),
      wordsChanged: Math.floor(text.split(' ').length * 0.2),
    }
  };
};

// Main humanization function
export const humanizeText = async (
  request: HumanizeRequest
): Promise<HumanizeResponse> => {
  try {
    // Try browser AI first (Chrome)
    if ('ai' in window && (window as any).ai?.rewriter) {
      const result = await humanizeWithBrowserAI(request.text, request.tone);
      return {
        original: request.text,
        humanized: result,
        wordCount: {
          original: request.text.split(' ').length,
          humanized: result.split(' ').length,
        }
      };
    }
  } catch (error) {
    console.log('Browser AI failed, using API or fallback');
  }
  
  // Fallback to API or simulation
  return humanizeWithAPI(request);
};