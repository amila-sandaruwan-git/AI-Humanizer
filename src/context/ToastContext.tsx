import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import toast, { Toaster, ToastOptions } from 'react-hot-toast';
import { useTheme } from '@mui/material/styles';

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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Toast styles based on theme
  const toastStyles = useMemo(() => ({
    success: {
      style: {
        background: isDark ? '#1e7e34' : '#4caf50',
        color: '#fff',
        borderRadius: '8px',
      },
    },
    error: {
      style: {
        background: isDark ? '#b71c1c' : '#f44336',
        color: '#fff',
        borderRadius: '8px',
      },
    },
    loading: {
      style: {
        background: isDark ? '#1e1e1e' : '#ffffff',
        color: isDark ? '#e0e0e0' : '#333333',
        borderRadius: '8px',
        border: isDark ? '1px solid rgba(255,255,255,0.12)' : 'none',
      },
    },
    default: {
      style: {
        background: isDark ? '#1e1e1e' : '#ffffff',
        color: isDark ? '#e0e0e0' : '#333333',
        borderRadius: '8px',
        border: isDark ? '1px solid rgba(255,255,255,0.12)' : 'none',
      },
    },
  }), [isDark]);

  const showSuccess = (message: string, options?: ToastOptions) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      ...toastStyles.success,
      ...options,
    });
  };

  const showError = (message: string, options?: ToastOptions) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
      ...toastStyles.error,
      ...options,
    });
  };

  const showInfo = (message: string, options?: ToastOptions) => {
    toast(message, {
      duration: 3000,
      position: 'top-right',
      icon: 'ℹ️',
      ...toastStyles.default,
      ...options,
    });
  };

  const showWarning = (message: string, options?: ToastOptions) => {
    toast(message, {
      duration: 3500,
      position: 'top-right',
      icon: '⚠️',
      ...toastStyles.default,
      ...options,
    });
  };

  const showLoading = (message: string, options?: ToastOptions): string => {
    return toast.loading(message, {
      position: 'top-right',
      ...toastStyles.loading,
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
            background: isDark ? '#1e1e1e' : '#ffffff',
            color: isDark ? '#e0e0e0' : '#333333',
            border: isDark ? '1px solid rgba(255,255,255,0.12)' : 'none',
          },
          success: toastStyles.success,
          error: toastStyles.error,
        }}
      />
    </ToastContext.Provider>
  );
};