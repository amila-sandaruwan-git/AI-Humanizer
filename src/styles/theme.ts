// src/styles/theme.ts

import { createTheme } from '@mui/material/styles';

const BRAND = '#667eea';
const BRAND_2 = '#764ba2';

export const theme = (mode: 'light' | 'dark') => {
  const dark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      ...(dark
        ? {
            primary: { main: '#90caf9', light: '#e3f2fd', dark: '#42a5f5' },
            secondary: { main: '#f48fb1', light: '#fce4ec', dark: '#f06292' },
            background: { default: '#0b0b16', paper: '#151526' },
            text: { primary: '#ececf6', secondary: '#a3a3bd' },
            divider: 'rgba(255,255,255,0.07)',
            success: { main: '#4ade80' },
            warning: { main: '#fbbf24' },
            error: { main: '#f87171' },
            info: { main: '#60a5fa' },
          }
        : {
            // Eye-friendly light palette: warmer neutrals, softer contrast
            primary: { main: '#5b6fd6', light: '#7c8ee6', dark: '#4456b8' },
            secondary: { main: '#a0479a', light: '#c36ebd', dark: '#7a3075' },
            background: {
              default: '#f7f8fc',   // soft blue-grey, less stark than #fff
              paper: '#ffffff',
            },
            text: {
              primary: '#2b2f45',   // softer than pure black, easier on eyes
              secondary: '#5a6078', // muted slate for secondary text
              disabled: '#9aa0b5',
            },
            divider: 'rgba(43,47,69,0.09)',
            success: { main: '#2fa060' },
            warning: { main: '#d98700' },
            error: { main: '#d64a4a' },
            info: { main: '#3a7bc8' },
            action: {
              hover: 'rgba(91,111,214,0.06)',
              selected: 'rgba(91,111,214,0.1)',
              focus: 'rgba(91,111,214,0.12)',
            },
          }),
    },

    shape: { borderRadius: 12 },

    typography: {
      fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'].join(','),
      h1: { fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.1 },
      h2: { fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15 },
      h3: { fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 },
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.015em' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em' },
      body1: { fontSize: '1rem', lineHeight: 1.7 },
      body2: { fontSize: '0.875rem', lineHeight: 1.65 },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: '-0.005em' },
      caption: { fontSize: '0.75rem' },
    },

    transitions: {
      duration: {
        shortest: 100,
        shorter: 150,
        short: 200,
        standard: 250,
        complex: 300,
        enteringScreen: 200,
        leavingScreen: 150,
      },
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            // Prevent horizontal overflow globally on mobile
            overflowX: 'hidden',
          },
          body: {
            backgroundColor: dark ? '#0b0b16' : '#f7f8fc',
            // Softer background tint gradient — warm and restful
            backgroundImage: dark
              ? `radial-gradient(900px 500px at 12% -5%, rgba(102,126,234,0.10), transparent 60%),
                 radial-gradient(800px 480px at 95% 8%, rgba(118,75,162,0.08), transparent 60%)`
              : `radial-gradient(900px 500px at 12% -5%, rgba(124,142,230,0.08), transparent 60%),
                 radial-gradient(800px 480px at 95% 8%, rgba(195,110,189,0.05), transparent 60%)`,
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
            // Smooth fonts
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            overflowX: 'hidden',
          },
          '::selection': {
            background: dark ? 'rgba(144,202,249,0.28)' : 'rgba(91,111,214,0.22)',
          },
          // Slightly larger min tap target for touch
          '@media (hover: none)': {
            '*': {
              WebkitTapHighlightColor: 'transparent',
            },
          },
        },
      },

      MuiButton: {
        defaultProps: {
          disableElevation: true,
          disableRipple: false,
        },
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontWeight: 600,
            padding: '8px 20px',
            textTransform: 'none',
            transition: 'transform 0.15s ease, background-color 0.15s ease',
            // Comfortable tap target on touch devices
            '@media (pointer: coarse)': {
              minHeight: 44,
            },
          },
          text: { color: dark ? '#ececf6' : '#2b2f45' },
          outlined: {
            color: dark ? '#ececf6' : '#2b2f45',
            borderColor: dark ? 'rgba(255,255,255,0.15)' : 'rgba(43,47,69,0.15)',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
        },
      },

      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
            ...(dark
              ? {
                  backgroundColor: '#151526',
                  borderColor: 'rgba(255,255,255,0.07)',
                }
              : {
                  backgroundColor: '#ffffff',
                  // Warm, subtle shadow — less harsh than pure black
                  boxShadow: '0 1px 2px rgba(43,47,69,0.04)',
                }),
          },
        },
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            backgroundColor: dark ? 'rgba(11,11,22,0.75)' : 'rgba(247,248,252,0.85)',
            borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(43,47,69,0.07)'}`,
            boxShadow: 'none',
          },
        },
      },

      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              ...(dark && {
                backgroundColor: 'rgba(255,255,255,0.04)',
                color: '#ececf6',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.09)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.18)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND },
              }),
              ...(!dark && {
                backgroundColor: '#ffffff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(43,47,69,0.12)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(43,47,69,0.22)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#5b6fd6',
                  borderWidth: 2,
                },
              }),
            },
            '& .MuiInputLabel-root': dark
              ? { color: '#a3a3bd', '&.Mui-focused': { color: '#90caf9' } }
              : { color: '#5a6078', '&.Mui-focused': { color: '#5b6fd6' } },
            '& .MuiInputBase-input': dark ? { color: '#ececf6' } : { color: '#2b2f45' },
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            ...(dark && {
              backgroundColor: 'rgba(255,255,255,0.035)',
              borderColor: 'rgba(255,255,255,0.07)',
            }),
          },
        },
      },

      MuiTypography: {
        styleOverrides: {
          root: dark ? { color: '#ececf6' } : {},
        },
      },

      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            ...(dark && { color: '#ececf6' }),
          },
        },
      },

      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 14,
            ...(!dark && {
              backgroundColor: '#ffffff',
              boxShadow: '0 8px 32px rgba(43,47,69,0.12)',
            }),
          },
        },
      },

      MuiMenuItem: {
        styleOverrides: {
          root: {
            ...(dark
              ? {
                  color: '#ececf6',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
                  '&.Mui-selected': { backgroundColor: 'rgba(102,126,234,0.14)' },
                }
              : {
                  color: '#2b2f45',
                  '&:hover': { backgroundColor: 'rgba(91,111,214,0.06)' },
                  '&.Mui-selected': { backgroundColor: 'rgba(91,111,214,0.1)' },
                }),
          },
        },
      },

      MuiInputLabel: {
        styleOverrides: {
          root: dark ? { color: '#a3a3bd' } : { color: '#5a6078' },
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: dark
            ? { borderColor: 'rgba(255,255,255,0.07)' }
            : { borderColor: 'rgba(43,47,69,0.09)' },
        },
      },

      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            ...(dark && {
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: '#ececf6',
            }),
          },
        },
      },

      MuiSlider: {
        styleOverrides: {
          root: dark ? { color: BRAND } : { color: '#5b6fd6' },
          rail: dark
            ? { backgroundColor: 'rgba(255,255,255,0.14)' }
            : { backgroundColor: 'rgba(43,47,69,0.12)' },
        },
      },

      MuiTooltip: {
        defaultProps: { enterDelay: 400 },
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: '0.72rem',
            ...(!dark && {
              backgroundColor: 'rgba(43,47,69,0.92)',
              color: '#ffffff',
            }),
          },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            ...(dark && { backgroundColor: '#151526' }),
          },
        },
      },

      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
          },
        },
      },

      MuiBackdrop: {
        styleOverrides: {
          root: {
            backgroundColor: dark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(43, 47, 69, 0.4)',
          },
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            // Ensure comfortable tap targets on mobile
            '@media (pointer: coarse)': {
              minWidth: 40,
              minHeight: 40,
            },
          },
        },
      },
    },
  });
};

export const brandGradient = `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_2} 100%)`;