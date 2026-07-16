import React, { createContext, useContext, ReactNode } from 'react';
import toast, { Toaster, ToastOptions } from 'react-hot-toast';

interface ToastContextType {
  showSuccess: (message: string, options?: ToastOptions) => void;
  showError: (message: string, options?: ToastOptions) => void;
  showInfo: (message: string, options?: ToastOptions) => void;
  showWarning: (message: string, options?: ToastOptions) => void;
  showLoading: (message: string, options?: ToastOptions) => string;
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
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const showSuccess = (message: string, options?: ToastOptions) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      ...options,
    });
  };

  const showError = (message: string, options?: ToastOptions) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
      ...options,
    });
  };

  const showInfo = (message: string, options?: ToastOptions) => {
    toast(message, {
      duration: 3000,
      position: 'top-right',
      icon: 'ℹ️',
      ...options,
    });
  };

  const showWarning = (message: string, options?: ToastOptions) => {
    toast(message, {
      duration: 3500,
      position: 'top-right',
      icon: '⚠️',
      ...options,
    });
  };

  const showLoading = (message: string, options?: ToastOptions): string => {
    return toast.loading(message, {
      position: 'top-right',
      ...options,
    });
  };

  const dismissToast = (id: string) => {
    toast.dismiss(id);
  };

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
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          style: {
            borderRadius: '8px',
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: '#4caf50',
              color: '#fff',
            },
          },
          error: {
            style: {
              background: '#f44336',
              color: '#fff',
            },
          },
        }}
      />
    </ToastContext.Provider>
  );
};