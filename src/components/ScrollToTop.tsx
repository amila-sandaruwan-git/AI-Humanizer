import React, { useState, useEffect } from 'react';
import { Fab, Zoom, useTheme } from '@mui/material';
import { KeyboardArrowUp } from '@mui/icons-material';

interface ScrollToTopProps {
  threshold?: number;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({ threshold = 300 }) => {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = document.documentElement.scrollTop;
      setVisible(scrolled > threshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <Zoom in={visible}>
      <Fab
        onClick={scrollToTop}
        size="medium"
        aria-label="Scroll to top"
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1000,
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          color: 'text.primary',
          boxShadow: isDark 
            ? '0 4px 20px rgba(0,0,0,0.3)' 
            : '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
            transform: 'translateY(-2px)',
            boxShadow: isDark 
              ? '0 8px 32px rgba(0,0,0,0.4)' 
              : '0 8px 32px rgba(0,0,0,0.12)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        }}
      >
        <KeyboardArrowUp sx={{ fontSize: 28 }} />
      </Fab>
    </Zoom>
  );
};

export default ScrollToTop;