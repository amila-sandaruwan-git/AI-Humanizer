// src/components/Toast.tsx

import React, { useEffect, useState, memo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Fade,
  useTheme,
  useMediaQuery,
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
  offsetTop = 80,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) return;
    setVisible(true);
    if (duration === Infinity) return;
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const positionStyles = (() => {
    const base = { position: 'fixed' as const, zIndex: 9999 };

    // On mobile, force top-center for best visibility
    if (isMobile) {
      return {
        ...base,
        top: offsetTop,
        left: 12,
        right: 12,
      };
    }

    switch (position) {
      case 'top-right': return { ...base, top: offsetTop, right: 16 };
      case 'top-left': return { ...base, top: offsetTop, left: 16 };
      case 'bottom-right': return { ...base, bottom: 16, right: 16 };
      case 'bottom-left': return { ...base, bottom: 16, left: 16 };
      case 'top-center': return { ...base, top: offsetTop, left: '50%', transform: 'translateX(-50%)' };
      case 'bottom-center': return { ...base, bottom: 16, left: '50%', transform: 'translateX(-50%)' };
      default: return { ...base, top: offsetTop, right: 16 };
    }
  })();

  const icon = (() => {
    switch (type) {
      case 'success': return <CheckCircle sx={{ fontSize: 18, color: isDark ? '#4ade80' : '#2fa060' }} />;
      case 'error': return <Error sx={{ fontSize: 18, color: isDark ? '#f87171' : '#d64a4a' }} />;
      case 'warning': return <Warning sx={{ fontSize: 18, color: isDark ? '#fbbf24' : '#d98700' }} />;
      case 'loading': return <AutoAwesome sx={{ fontSize: 18, color: isDark ? '#818cf8' : '#5b6fd6' }} />;
      default: return <Info sx={{ fontSize: 18, color: isDark ? '#60a5fa' : '#3a7bc8' }} />;
    }
  })();

  const accentColor = {
    success: isDark ? '#4ade80' : '#2fa060',
    error: isDark ? '#f87171' : '#d64a4a',
    warning: isDark ? '#fbbf24' : '#d98700',
    info: isDark ? '#60a5fa' : '#3a7bc8',
    loading: isDark ? '#818cf8' : '#5b6fd6',
  }[type];

  return (
    <Fade in={visible} timeout={200}>
      <Box
        sx={{
          ...positionStyles,
          maxWidth: isMobile ? '100%' : 360,
          minWidth: isMobile ? 'auto' : 180,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            pr: 1,
            borderRadius: '12px',
            background: isDark ? 'rgba(30, 30, 40, 0.94)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(43, 47, 69, 0.08)',
            borderLeft: `3px solid ${accentColor}`,
            boxShadow: isDark
              ? '0 8px 28px rgba(0, 0, 0, 0.4)'
              : '0 8px 28px rgba(43, 47, 69, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {icon}
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: isDark ? '#e8e8f0' : '#2b2f45',
              fontWeight: 500,
              fontSize: { xs: '0.8125rem', sm: '0.8125rem' },
              lineHeight: 1.4,
              fontFamily: 'Inter, Roboto, sans-serif',
              flex: 1,
              minWidth: 0,
            }}
          >
            {message}
          </Typography>

          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(43,47,69,0.3)',
              p: 0.5,
              flexShrink: 0,
              width: 32,
              height: 32,
              '&:hover': {
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(43,47,69,0.6)',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(43,47,69,0.05)',
              },
            }}
            aria-label="Close notification"
          >
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Paper>
      </Box>
    </Fade>
  );
};

export default memo(Toast);