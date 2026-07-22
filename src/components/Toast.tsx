import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Fade,
  useTheme,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Info,
  Warning,
  Close,
  AutoAwesome,
} from '@mui/icons-material';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastProps {
  open: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  offsetTop?: number;
}

const Toast: React.FC<ToastProps> = ({
  open,
  message,
  type = 'info',
  duration = 3500,
  onClose,
  position = 'top-right',
  offsetTop = 80, // Default offset for navbar
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open, duration]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  const getPositionStyles = () => {
    const base = {
      position: 'fixed',
      zIndex: 9999,
      transition: 'all 0.3s ease',
    };
    switch (position) {
      case 'top-right':
        return { ...base, top: offsetTop, right: 16 };
      case 'top-left':
        return { ...base, top: offsetTop, left: 16 };
      case 'bottom-right':
        return { ...base, bottom: 16, right: 16 };
      case 'bottom-left':
        return { ...base, bottom: 16, left: 16 };
      case 'top-center':
        return { ...base, top: offsetTop, left: '50%', transform: 'translateX(-50%)' };
      case 'bottom-center':
        return { ...base, bottom: 16, left: '50%', transform: 'translateX(-50%)' };
      default:
        return { ...base, top: offsetTop, right: 16 };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle sx={{ fontSize: 18, color: isDark ? '#4ade80' : '#22c55e' }} />;
      case 'error':
        return <Error sx={{ fontSize: 18, color: isDark ? '#f87171' : '#ef4444' }} />;
      case 'warning':
        return <Warning sx={{ fontSize: 18, color: isDark ? '#fbbf24' : '#f59e0b' }} />;
      case 'loading':
        return <AutoAwesome sx={{ fontSize: 18, color: isDark ? '#818cf8' : '#6366f1', animation: 'spin 1s linear infinite' }} />;
      default:
        return <Info sx={{ fontSize: 18, color: isDark ? '#60a5fa' : '#3b82f6' }} />;
    }
  };

  const getGlassStyles = () => {
    const base = {
      background: isDark 
        ? 'rgba(30, 30, 40, 0.85)' 
        : 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: isDark 
        ? '1px solid rgba(255, 255, 255, 0.08)' 
        : '1px solid rgba(255, 255, 255, 0.6)',
      boxShadow: isDark
        ? '0 8px 32px rgba(0, 0, 0, 0.4)'
        : '0 8px 32px rgba(0, 0, 0, 0.08)',
    };

    const accentColors = {
      success: isDark ? '#4ade80' : '#22c55e',
      error: isDark ? '#f87171' : '#ef4444',
      warning: isDark ? '#fbbf24' : '#f59e0b',
      info: isDark ? '#60a5fa' : '#3b82f6',
      loading: isDark ? '#818cf8' : '#6366f1',
    };

    return {
      ...base,
      borderLeft: `3px solid ${accentColors[type]}`,
    };
  };

  const glassStyles = getGlassStyles();
  const positionStyles = getPositionStyles();

  if (!open && !visible) return null;

  return (
    <Fade in={visible} timeout={250}>
      <Box
        sx={{
          ...positionStyles,
          maxWidth: '360px',
          width: 'auto',
          minWidth: '180px',
          animation: 'slideIn 0.25s ease forwards',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            pr: 1,
            borderRadius: '12px',
            ...glassStyles,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Glass shimmer effect */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
              animation: 'shimmer 4s infinite',
              pointerEvents: 'none',
            }}
          />

          {/* Icon */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {getIcon()}
          </Box>

          {/* Message */}
          <Typography
            variant="body2"
            sx={{
              color: isDark ? '#e8e8f0' : '#1a1a2e',
              fontWeight: 450,
              fontSize: '0.8125rem',
              lineHeight: 1.4,
              fontFamily: 'Inter, Roboto, sans-serif',
              flex: 1,
              py: 0.25,
            }}
          >
            {message}
          </Typography>

          {/* Close Button */}
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
              p: 0.5,
              flexShrink: 0,
              '&:hover': {
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <Close sx={{ fontSize: 14 }} />
          </IconButton>

          {/* Progress bar */}
          {type !== 'loading' && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 2,
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: '100%',
                  background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                  animation: `shrink ${duration}ms linear forwards`,
                  transformOrigin: 'left',
                  borderRadius: 1,
                }}
              />
            </Box>
          )}
        </Paper>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(20px) scale(0.96);
            }
            to {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          @keyframes shrink {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
          }
        `}</style>
      </Box>
    </Fade>
  );
};

export default Toast;