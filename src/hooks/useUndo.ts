import { useState, useCallback, useRef, useEffect } from 'react';

interface UseUndoOptions {
  maxHistory?: number;
}

export const useUndo = <T>(initialValue: T, options: UseUndoOptions = {}) => {
  const { maxHistory = 50 } = options;
  
  // Store history of values
  const [history, setHistory] = useState<T[]>([initialValue]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [value, setValue] = useState<T>(initialValue);
  
  // Track if we're in the middle of an undo/redo operation
  const isUndoRedoRef = useRef(false);
  // Track if the value is being set from an external source (like a paste)
  const isExternalUpdateRef = useRef(false);

  // Push a new value to history
  const pushHistory = useCallback((newValue: T) => {
    // Don't push if we're in the middle of undo/redo
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    setHistory(prev => {
      // Remove any future states (if we're not at the end)
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new value
      newHistory.push(newValue);
      
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        // Adjust current index if we shifted
        setCurrentIndex(prevIndex => Math.max(0, prevIndex - 1));
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => Math.min(prev + 1, maxHistory));
    setValue(newValue);
  }, [currentIndex, maxHistory]);

  // Undo
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUndoRedoRef.current = true;
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      const previousValue = history[newIndex];
      setValue(previousValue);
      return previousValue;
    }
    return value;
  }, [currentIndex, history, value]);

  // Redo
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      const nextValue = history[newIndex];
      setValue(nextValue);
      return nextValue;
    }
    return value;
  }, [currentIndex, history, value]);

  // Set value and push to history (for external updates)
  const setValueWithHistory = useCallback((newValue: T) => {
    setValue(newValue);
    pushHistory(newValue);
  }, [pushHistory]);

  // Set value without pushing to history (for clearing)
  const setValueImmediate = useCallback((newValue: T) => {
    isUndoRedoRef.current = true;
    setValue(newValue);
    // Clear history and start fresh
    setHistory([newValue]);
    setCurrentIndex(0);
    isUndoRedoRef.current = false;
  }, []);

  // Reset to a specific value (clears history)
  const reset = useCallback((newValue: T) => {
    setHistory([newValue]);
    setCurrentIndex(0);
    setValue(newValue);
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([value]);
    setCurrentIndex(0);
  }, [value]);

  // Get current value
  const getCurrentValue = useCallback(() => {
    return history[currentIndex];
  }, [history, currentIndex]);

  return {
    value,
    setValue: setValueWithHistory,
    setValueImmediate,
    undo,
    redo,
    reset,
    clearHistory,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    historyLength: history.length,
    currentIndex,
    getCurrentValue,
  };
};