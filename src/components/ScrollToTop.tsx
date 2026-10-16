// src/components/ScrollToTop.tsx

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Fab, Zoom, useTheme, useMediaQuery } from '@mui/material';
import { KeyboardArrowUp } from '@mui/icons-material';

interface ScrollToTopProps {
  threshold?: number;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({ threshold = 300 }) => {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const tickingRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        setVisible(window.scrollY > threshold);
        tickingRef.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <Zoom in={visible}>
      <Fab
        onClick={scrollToTop}
        size={isMobile ? 'small' : 'medium'}
        aria-label="Scroll to top"
        sx={{
          position: 'fixed',
          bottom: isMobile
            ? 'calc(16px + env(safe-area-inset-bottom))'
            : 32,
          right: isMobile ? 16 : 32,
          zIndex: 1000,
          backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(91,111,214,0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(91,111,214,0.4)',
          color: isDark ? '#ececf6' : '#ffffff',
          boxShadow: 'none',
          width: isMobile ? 44 : 56,
          height: isMobile ? 44 : 56,
          '&:hover': {
            backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(91,111,214,1)',
          },
        }}
      >
        <KeyboardArrowUp sx={{ fontSize: isMobile ? 22 : 28 }} />
      </Fab>
    </Zoom>
  );
};

export default memo(ScrollToTop);