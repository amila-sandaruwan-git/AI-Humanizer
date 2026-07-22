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

const Header: React.FC<HeaderProps> = ({ onAboutClick, onHelpClick, onFeedbackClick }) => {
  const colorMode = useContext(ColorModeContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);

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

  return (
    <AppBar 
      position="fixed"
      color="transparent" 
      elevation={0}
      sx={{
        backdropFilter: 'blur(20px)',
        backgroundColor: colorMode?.mode === 'dark' 
          ? 'rgba(18, 18, 18, 0.85)' 
          : 'rgba(255, 255, 255, 0.85)',
        borderBottom: `1px solid ${colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: colorMode?.mode === 'dark' 
          ? '0 4px 30px rgba(0, 0, 0, 0.3)' 
          : '0 4px 30px rgba(0, 0, 0, 0.06)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 0.5, minHeight: { xs: 64, sm: 72 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                  color: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontFamily: 'Inter, sans-serif',
                  marginTop: '-4px',
                }}
              >
                Transform AI Text
              </Typography>
            </Box>
          </Box>

          {!isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
              <Button
                color="inherit"
                onClick={onAboutClick}
                sx={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  px: 2,
                  py: 1,
                  borderRadius: '8px',
                  color: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  '&:hover': {
                    backgroundColor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    color: colorMode?.mode === 'dark' ? '#fff' : '#000',
                  },
                }}
                startIcon={<Info sx={{ fontSize: 18 }} />}
              >
                About
              </Button>

              <Button
                color="inherit"
                onClick={onHelpClick}
                sx={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  px: 2,
                  py: 1,
                  borderRadius: '8px',
                  color: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  '&:hover': {
                    backgroundColor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    color: colorMode?.mode === 'dark' ? '#fff' : '#000',
                  },
                }}
                startIcon={<Help sx={{ fontSize: 18 }} />}
              >
                Help
              </Button>

              <Button
                color="inherit"
                onClick={onFeedbackClick}
                sx={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  px: 2,
                  py: 1,
                  borderRadius: '8px',
                  color: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  '&:hover': {
                    backgroundColor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    color: colorMode?.mode === 'dark' ? '#fff' : '#000',
                  },
                }}
                startIcon={<Comment sx={{ fontSize: 18 }} />}
              >
                Feedback
              </Button>

              <Divider orientation="vertical" flexItem sx={{ mx: 1, opacity: 0.3 }} />

              <Tooltip title={colorMode?.mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                <IconButton
                  onClick={colorMode?.toggleColorMode}
                  sx={{
                    borderRadius: '10px',
                    width: 40,
                    height: 40,
                    backgroundColor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    '&:hover': {
                      backgroundColor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                    },
                  }}
                >
                  {colorMode?.mode === 'dark' ? (
                    <Brightness7 sx={{ fontSize: 20, color: '#fbbf24' }} />
                  ) : (
                    <Brightness4 sx={{ fontSize: 20, color: '#6366f1' }} />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={colorMode?.toggleColorMode}
                size="small"
                sx={{
                  borderRadius: '10px',
                  width: 38,
                  height: 38,
                  backgroundColor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                }}
              >
                {colorMode?.mode === 'dark' ? (
                  <Brightness7 sx={{ fontSize: 18, color: '#fbbf24' }} />
                ) : (
                  <Brightness4 sx={{ fontSize: 18, color: '#6366f1' }} />
                )}
              </IconButton>

              <IconButton
                onClick={handleMobileMenuOpen}
                size="small"
                sx={{
                  borderRadius: '10px',
                  width: 38,
                  height: 38,
                  backgroundColor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                }}
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
                      borderRadius: '16px',
                      minWidth: 200,
                      backgroundColor: colorMode?.mode === 'dark' ? '#1e1e1e' : '#ffffff',
                      border: `1px solid ${colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                      boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    },
                  },
                }}
              >
                <MenuItem onClick={handleAboutClick} sx={{ py: 1.5, px: 2 }}>
                  <Info sx={{ mr: 1.5, fontSize: 20 }} />
                  <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>About</Typography>
                </MenuItem>
                <MenuItem onClick={handleHelpClick} sx={{ py: 1.5, px: 2 }}>
                  <Help sx={{ mr: 1.5, fontSize: 20 }} />
                  <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Help</Typography>
                </MenuItem>
                <MenuItem onClick={handleFeedbackClick} sx={{ py: 1.5, px: 2 }}>
                  <Comment sx={{ mr: 1.5, fontSize: 20 }} />
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