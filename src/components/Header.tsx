// src/components/Header.tsx
// REPLACE — styling only. Props, handlers, state, context, and click behaviour are identical to your original.

import React, { useContext, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AutoAwesome,
  Brightness4,
  Brightness7,
  Info,
  Help,
  Menu as MenuIcon,
  Comment,
} from '@mui/icons-material';
import { ColorModeContext } from '../App';

interface HeaderProps {
  onAboutClick?: () => void;
  onHelpClick?: () => void;
  onFeedbackClick?: () => void;
}

const BRAND_GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

const Header: React.FC<HeaderProps> = ({ onAboutClick, onHelpClick, onFeedbackClick }) => {
  const colorMode = useContext(ColorModeContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const isDark = colorMode?.mode === 'dark';

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleAboutClick = () => {
    handleMobileMenuClose();
    if (onAboutClick) onAboutClick();
  };

  const handleHelpClick = () => {
    handleMobileMenuClose();
    if (onHelpClick) onHelpClick();
  };

  const handleFeedbackClick = () => {
    handleMobileMenuClose();
    if (onFeedbackClick) onFeedbackClick();
  };

  // ---- shared style tokens (design only) ----
  const textMuted = isDark ? 'rgba(236,236,246,0.68)' : 'rgba(24,24,48,0.68)';
  const textStrong = isDark ? '#ffffff' : '#181830';
  const hoverBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(102,126,234,0.09)';
  const chipBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(24,24,48,0.045)';
  const chipBgHover = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(102,126,234,0.14)';

  const navButtonSx = {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500,
    fontSize: '0.875rem',
    px: 1.75,
    py: 0.9,
    borderRadius: '999px',
    color: textMuted,
    position: 'relative' as const,
    transition: 'background-color .2s ease, color .2s ease',
    '& .MuiButton-startIcon': { mr: 0.75, transition: 'color .2s ease' },
    '&:hover': {
      backgroundColor: hoverBg,
      color: textStrong,
      transform: 'none',
      boxShadow: 'none',
      '& .MuiButton-startIcon': { color: '#667eea' },
    },
  };

  const iconButtonSx = (size: number) => ({
    borderRadius: '12px',
    width: size,
    height: size,
    backgroundColor: chipBg,
    transition: 'background-color .2s ease, transform .2s ease',
    '&:hover': { backgroundColor: chipBgHover, transform: 'rotate(12deg)' },
  });

  return (
    <AppBar
      position="fixed"
      color="transparent"
      elevation={0}
      sx={{
        backdropFilter: 'saturate(160%) blur(18px)',
        WebkitBackdropFilter: 'saturate(160%) blur(18px)',
        backgroundColor: isDark ? 'rgba(11, 11, 22, 0.72)' : 'rgba(255, 255, 255, 0.74)',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(24,24,48,0.07)'}`,
        boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.35)' : '0 8px 32px rgba(24, 24, 48, 0.06)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        // thin brand hairline along the bottom edge
        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -1,
          height: '1px',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(102,126,234,0.55) 30%, rgba(118,75,162,0.55) 70%, transparent 100%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 0.5, minHeight: { xs: 64, sm: 72 } }}>
          {/* Brand: logo mark + wordmark */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexShrink: 0 }}>
            <Box
              sx={{
                width: { xs: 34, sm: 40 },
                height: { xs: 34, sm: 40 },
                borderRadius: '12px',
                background: BRAND_GRADIENT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(102,126,234,0.38)',
                flexShrink: 0,
              }}
            >
              <AutoAwesome sx={{ fontSize: { xs: 18, sm: 21 }, color: '#fff' }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1rem', sm: '1.2rem' },
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.15,
                  background: BRAND_GRADIENT,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                AI Humanizer
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  color: isDark ? 'rgba(255,255,255,0.42)' : 'rgba(24,24,48,0.45)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: 1.2,
                }}
              >
                Transform AI Text
              </Typography>
            </Box>
          </Box>

          {!isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
              {/* Pill-shaped nav group */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25,
                  p: 0.5,
                  borderRadius: '999px',
                  backgroundColor: chipBg,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(24,24,48,0.05)'}`,
                }}
              >
                <Button
                  color="inherit"
                  onClick={onAboutClick}
                  sx={navButtonSx}
                  startIcon={<Info sx={{ fontSize: 18 }} />}
                >
                  About
                </Button>

                <Button
                  color="inherit"
                  onClick={onHelpClick}
                  sx={navButtonSx}
                  startIcon={<Help sx={{ fontSize: 18 }} />}
                >
                  Help
                </Button>

                <Button
                  color="inherit"
                  onClick={onFeedbackClick}
                  sx={navButtonSx}
                  startIcon={<Comment sx={{ fontSize: 18 }} />}
                >
                  Feedback
                </Button>
              </Box>

              <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1, opacity: 0.35 }} />

              <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                <IconButton onClick={colorMode?.toggleColorMode} sx={iconButtonSx(40)}>
                  {isDark ? (
                    <Brightness7 sx={{ fontSize: 20, color: '#fbbf24' }} />
                  ) : (
                    <Brightness4 sx={{ fontSize: 20, color: '#6366f1' }} />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={colorMode?.toggleColorMode} size="small" sx={iconButtonSx(38)}>
                {isDark ? (
                  <Brightness7 sx={{ fontSize: 18, color: '#fbbf24' }} />
                ) : (
                  <Brightness4 sx={{ fontSize: 18, color: '#6366f1' }} />
                )}
              </IconButton>

              <IconButton onClick={handleMobileMenuOpen} size="small" sx={iconButtonSx(38)}>
                <MenuIcon />
              </IconButton>

              <Menu
                anchorEl={mobileMenuAnchor}
                open={Boolean(mobileMenuAnchor)}
                onClose={handleMobileMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      p: 0.5,
                      borderRadius: '16px',
                      minWidth: 210,
                      backgroundColor: isDark ? '#151526' : '#ffffff',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(24,24,48,0.07)'}`,
                      boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
                    },
                  },
                }}
              >
                <MenuItem onClick={handleAboutClick} sx={{ py: 1.25, px: 1.75, borderRadius: '10px' }}>
                  <Info sx={{ mr: 1.5, fontSize: 20, color: '#667eea' }} />
                  <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>About</Typography>
                </MenuItem>
                <MenuItem onClick={handleHelpClick} sx={{ py: 1.25, px: 1.75, borderRadius: '10px' }}>
                  <Help sx={{ mr: 1.5, fontSize: 20, color: '#667eea' }} />
                  <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Help</Typography>
                </MenuItem>
                <MenuItem onClick={handleFeedbackClick} sx={{ py: 1.25, px: 1.75, borderRadius: '10px' }}>
                  <Comment sx={{ mr: 1.5, fontSize: 20, color: '#667eea' }} />
                  <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Feedback</Typography>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;