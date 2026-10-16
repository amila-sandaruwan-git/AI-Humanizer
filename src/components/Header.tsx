// src/components/Header.tsx

import React, { useContext, useState, memo } from 'react';
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

  const handleMobileMenuClose = () => setMobileMenuAnchor(null);

  const handleAboutClick = () => {
    handleMobileMenuClose();
    onAboutClick?.();
  };

  const handleHelpClick = () => {
    handleMobileMenuClose();
    onHelpClick?.();
  };

  const handleFeedbackClick = () => {
    handleMobileMenuClose();
    onFeedbackClick?.();
  };

  const textMuted = isDark ? 'rgba(236,236,246,0.68)' : 'rgba(43,47,69,0.68)';
  const textStrong = isDark ? '#ffffff' : '#2b2f45';
  const hoverBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(91,111,214,0.08)';
  const chipBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(43,47,69,0.05)';

  const navButtonSx = {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500,
    fontSize: '0.875rem',
    px: 1.75,
    py: 0.9,
    borderRadius: '999px',
    color: textMuted,
    textTransform: 'none' as const,
    transition: 'background-color 0.15s ease, color 0.15s ease',
    '&:hover': {
      backgroundColor: hoverBg,
      color: textStrong,
    },
  };

  return (
    <AppBar
      position="fixed"
      color="transparent"
      elevation={0}
      sx={{
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        backgroundColor: isDark ? 'rgba(11, 11, 22, 0.78)' : 'rgba(247, 248, 252, 0.88)',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(43,47,69,0.08)'}`,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>
        <Toolbar disableGutters sx={{ py: 0.5, minHeight: { xs: 56, sm: 64, md: 72 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.25 }, flexShrink: 0 }}>
            <Box
              sx={{
                width: { xs: 32, sm: 36, md: 40 },
                height: { xs: 32, sm: 36, md: 40 },
                borderRadius: '12px',
                background: BRAND_GRADIENT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AutoAwesome sx={{ fontSize: { xs: 16, sm: 18, md: 21 }, color: '#fff' }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '0.9375rem', sm: '1.05rem', md: '1.2rem' },
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
                  color: isDark ? 'rgba(255,255,255,0.42)' : 'rgba(43,47,69,0.5)',
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
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25,
                  p: 0.5,
                  borderRadius: '999px',
                  backgroundColor: chipBg,
                  border: `1px solid ${
                    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(43,47,69,0.06)'
                  }`,
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
                <IconButton
                  onClick={colorMode?.toggleColorMode}
                  sx={{
                    borderRadius: '12px',
                    width: 40,
                    height: 40,
                    backgroundColor: chipBg,
                    '&:hover': { backgroundColor: hoverBg },
                  }}
                  aria-label="Toggle theme"
                >
                  {isDark ? (
                    <Brightness7 sx={{ fontSize: 20, color: '#fbbf24' }} />
                  ) : (
                    <Brightness4 sx={{ fontSize: 20, color: '#5b6fd6' }} />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                onClick={colorMode?.toggleColorMode}
                size="small"
                sx={{
                  borderRadius: '12px',
                  width: 40,
                  height: 40,
                  backgroundColor: chipBg,
                }}
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Brightness7 sx={{ fontSize: 18, color: '#fbbf24' }} />
                ) : (
                  <Brightness4 sx={{ fontSize: 18, color: '#5b6fd6' }} />
                )}
              </IconButton>

              <IconButton
                onClick={handleMobileMenuOpen}
                size="small"
                sx={{
                  borderRadius: '12px',
                  width: 40,
                  height: 40,
                  backgroundColor: chipBg,
                }}
                aria-label="Open menu"
              >
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
                      minWidth: 220,
                      backgroundColor: isDark ? '#151526' : '#ffffff',
                      border: `1px solid ${
                        isDark ? 'rgba(255,255,255,0.08)' : 'rgba(43,47,69,0.08)'
                      }`,
                      boxShadow: isDark
                        ? '0 16px 48px rgba(0,0,0,0.4)'
                        : '0 16px 48px rgba(43,47,69,0.12)',
                    },
                  },
                }}
              >
                <MenuItem
                  onClick={handleAboutClick}
                  sx={{ py: 1.5, px: 1.75, borderRadius: '10px', minHeight: 48 }}
                >
                  <Info sx={{ mr: 1.5, fontSize: 20, color: '#667eea' }} />
                  <Typography
                    sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.9375rem' }}
                  >
                    About
                  </Typography>
                </MenuItem>
                <MenuItem
                  onClick={handleHelpClick}
                  sx={{ py: 1.5, px: 1.75, borderRadius: '10px', minHeight: 48 }}
                >
                  <Help sx={{ mr: 1.5, fontSize: 20, color: '#667eea' }} />
                  <Typography
                    sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.9375rem' }}
                  >
                    Help
                  </Typography>
                </MenuItem>
                <MenuItem
                  onClick={handleFeedbackClick}
                  sx={{ py: 1.5, px: 1.75, borderRadius: '10px', minHeight: 48 }}
                >
                  <Comment sx={{ mr: 1.5, fontSize: 20, color: '#667eea' }} />
                  <Typography
                    sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.9375rem' }}
                  >
                    Feedback
                  </Typography>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default memo(Header);