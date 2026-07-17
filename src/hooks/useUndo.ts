import { useState, useCallback, useRef, useEffect } from 'react';

interface UseUndoOptions {
  maxHistory?: number;
  debounceTime?: number;
}

export const useUndo = <T>(initialValue: T, options: UseUndoOptions = {}) => {
  const { maxHistory = 50, debounceTime = 300 } = options;
  
  const [history, setHistory] = useState<T[]>([initialValue]);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState<T>(initialValue);
  const isUndoRedoRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Push new value to history
  const pushHistory = useCallback((newValue: T) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    setHistory(prev => {
      const newHistory = prev.slice(0, index + 1);
      newHistory.push(newValue);
      
      if (newHistory.length > maxHistory) {
        newHistory.shift();
      }
      
      return newHistory;
    });
    
    setIndex(prev => Math.min(prev + 1, maxHistory));
    setValue(newValue);
  }, [index, maxHistory]);

  // Debounced version for text input
  const pushHistoryDebounced = useCallback((newValue: T) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      pushHistory(newValue);
    }, debounceTime);
  }, [pushHistory, debounceTime]);

  // Undo
  const undo = useCallback(() => {
    if (index > 0) {
      isUndoRedoRef.current = true;
      const newIndex = index - 1;
      setIndex(newIndex);
      setValue(history[newIndex]);
      return history[newIndex];
    }
    return value;
  }, [index, history, value]);

  // Redo
  const redo = useCallback(() => {
    if (index < history.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = index + 1;
      setIndex(newIndex);
      setValue(history[newIndex]);
      return history[newIndex];
    }
    return value;
  }, [index, history, value]);

  // Reset
  const reset = useCallback((newValue: T) => {
    setHistory([newValue]);
    setIndex(0);
    setValue(newValue);
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([value]);
    setIndex(0);
  }, [value]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    value,
    setValue,
    setValueDebounced: pushHistoryDebounced,
    setValueImmediate: (newValue: T) => {
      pushHistory(newValue);
    },
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