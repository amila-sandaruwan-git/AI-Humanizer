// src/hooks/useUndo.ts

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseUndoOptions {
  maxHistory?: number;
}

export const useUndo = <T>(initialValue: T, options: UseUndoOptions = {}) => {
  const { maxHistory = 100 } = options; // Increased for character-by-character undo
  
  const [history, setHistory] = useState<T[]>([initialValue]);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState<T>(initialValue);
  const isUndoRedoRef = useRef(false);
  const lastValueRef = useRef<T>(initialValue);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingValueRef = useRef<T | null>(null);

  // Push new value to history - called immediately for each change
  const pushHistory = useCallback((newValue: T) => {
    // Skip if this is from undo/redo operation
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    // Skip if value hasn't changed
    if (JSON.stringify(newValue) === JSON.stringify(value)) {
      return;
    }

    setHistory(prev => {
      // Trim history to current index
      const newHistory = prev.slice(0, index + 1);
      newHistory.push(newValue);
      
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
      }
      
      return newHistory;
    });
    
    setIndex(prev => Math.min(prev + 1, maxHistory));
    setValue(newValue);
    lastValueRef.current = newValue;
  }, [index, maxHistory, value]);

  // Handle typing - saves on every keystroke with small debounce
  const handleTyping = useCallback((newValue: T) => {
    // Update the displayed value immediately
    setValue(newValue);
    
    // Store the pending value
    pendingValueRef.current = newValue;
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Use a very short debounce (100ms) to save history on every keystroke
    debounceTimerRef.current = setTimeout(() => {
      if (pendingValueRef.current !== null) {
        const pendingValue = pendingValueRef.current;
        pendingValueRef.current = null;
        
        // Skip if this is from undo/redo operation
        if (isUndoRedoRef.current) {
          isUndoRedoRef.current = false;
          return;
        }
        
        // Skip if value hasn't changed
        if (JSON.stringify(pendingValue) === JSON.stringify(value)) {
          return;
        }
        
        setHistory(prev => {
          const newHistory = prev.slice(0, index + 1);
          newHistory.push(pendingValue);
          
          if (newHistory.length > maxHistory) {
            newHistory.shift();
          }
          
          return newHistory;
        });
        
        setIndex(prev => Math.min(prev + 1, maxHistory));
        lastValueRef.current = pendingValue;
      }
      debounceTimerRef.current = null;
    }, 100); // 100ms debounce for character-by-character undo
  }, [index, maxHistory, value]);

  // Push value immediately (for file uploads, clearing, etc.)
  const pushImmediate = useCallback((newValue: T) => {
    // Clear any pending timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      pendingValueRef.current = null;
    }
    pushHistory(newValue);
  }, [pushHistory]);

  // Undo - goes back one character change
  const undo = useCallback(() => {
    // Clear any pending timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      pendingValueRef.current = null;
    }
    
    if (index > 0) {
      isUndoRedoRef.current = true;
      const newIndex = index - 1;
      setIndex(newIndex);
      const newValue = history[newIndex];
      setValue(newValue);
      lastValueRef.current = newValue;
      return newValue;
    }
    return value;
  }, [index, history, value]);

  // Redo - goes forward one character change
  const redo = useCallback(() => {
    // Clear any pending timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      pendingValueRef.current = null;
    }
    
    if (index < history.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = index + 1;
      setIndex(newIndex);
      const newValue = history[newIndex];
      setValue(newValue);
      lastValueRef.current = newValue;
      return newValue;
    }
    return value;
  }, [index, history, value]);

  // Reset
  const reset = useCallback((newValue: T) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      pendingValueRef.current = null;
    }
    setHistory([newValue]);
    setIndex(0);
    setValue(newValue);
    lastValueRef.current = newValue;
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      pendingValueRef.current = null;
    }
    setHistory([value]);
    setIndex(0);
  }, [value]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        pendingValueRef.current = null;
      }
    };
  }, []);

  return {
    value,
    setValue: handleTyping, // For typing (saves every keystroke)
    setValueImmediate: pushImmediate, // For immediate history push
    undo,
    redo,
    reset,
    clearHistory,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
    historyLength: history.length,
    currentIndex: index,
  };
};