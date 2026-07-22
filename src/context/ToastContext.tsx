import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import Toast, { ToastType } from '../components/Toast';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showLoading: (message: string) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  toastOffsetTop?: number; // Add offset prop
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  toastOffsetTop = 80 // Default offset for navbar
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    addToast(message, 'success', duration || 3500);
  }, [addToast]);

  const showError = useCallback((message: string, duration?: number) => {
    addToast(message, 'error', duration || 4000);
  }, [addToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    addToast(message, 'info', duration || 3500);
  }, [addToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    addToast(message, 'warning', duration || 3500);
  }, [addToast]);

  const showLoading = useCallback((message: string): string => {
    return addToast(message, 'loading', Infinity);
  }, [addToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showSuccess,
        showError,
        showInfo,
        showWarning,
        showLoading,
        dismissToast,
      }}
    >
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          open={true}
          message={toast.message}
          type={toast.type}
          duration={toast.duration === Infinity ? 99999 : toast.duration}
          onClose={() => dismissToast(toast.id)}
          position="top-right"
          offsetTop={toastOffsetTop}
        />
      ))}
    </ToastContext.Provider>
  );
};