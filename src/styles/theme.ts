// src/styles/theme.ts  (REPLACE — styling only, same export signature: theme(mode))

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
          }
        : {
            primary: { main: BRAND, light: '#818cf8', dark: '#4f46e5' },
            secondary: { main: '#dc004e', light: '#ff4081', dark: '#9a0036' },
            background: { default: '#f4f5fb', paper: '#ffffff' },
            text: { primary: '#181830', secondary: '#55557a' },
            divider: 'rgba(24,24,48,0.08)',
          }),
    },

    shape: { borderRadius: 12 },

    typography: {
      fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'].join(','),
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

    components: {
      /* Page background: soft brand glow, mode-aware */
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: dark ? '#0b0b16' : '#f4f5fb',
            backgroundImage: dark
              ? `radial-gradient(900px 500px at 12% -5%, rgba(102,126,234,0.16), transparent 60%),
                 radial-gradient(800px 480px at 95% 8%, rgba(118,75,162,0.14), transparent 60%)`
              : `radial-gradient(900px 500px at 12% -5%, rgba(102,126,234,0.14), transparent 60%),
                 radial-gradient(800px 480px at 95% 8%, rgba(118,75,162,0.10), transparent 60%)`,
            backgroundAttachment: 'fixed',
          },
          '::selection': { background: 'rgba(102,126,234,0.32)' },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontWeight: 600,
            padding: '8px 20px',
            transition: 'transform .18s ease, box-shadow .18s ease, background-color .18s ease',
          },
          // keep readable text colour on text/outlined only; contained keeps its contrast text
          text: { color: dark ? '#ececf6' : '#181830' },
          outlined: { color: dark ? '#ececf6' : '#181830' },
          contained: {
            boxShadow: '0 6px 18px rgba(102,126,234,0.28)',
            '&:hover': { boxShadow: '0 10px 26px rgba(102,126,234,0.38)' },
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
            ...(dark
              ? { backgroundColor: '#151526', borderColor: 'rgba(255,255,255,0.07)' }
              : { boxShadow: '0 1px 2px rgba(24,24,48,0.04), 0 8px 24px rgba(24,24,48,0.05)' }),
          },
        },
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            backdropFilter: 'saturate(160%) blur(18px)',
            WebkitBackdropFilter: 'saturate(160%) blur(18px)',
            backgroundColor: dark ? 'rgba(11,11,22,0.72)' : 'rgba(255,255,255,0.72)',
            borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(24,24,48,0.06)'}`,
            boxShadow: 'none',
          },
        },
      },

      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              transition: 'box-shadow .2s ease',
              '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(102,126,234,0.16)' },
              ...(dark && {
                backgroundColor: 'rgba(255,255,255,0.04)',
                color: '#ececf6',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.09)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.18)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND },
              }),
            },
            '& .MuiInputLabel-root': dark ? { color: '#a3a3bd', '&.Mui-focused': { color: '#90caf9' } } : {},
            '& .MuiInputBase-input': dark ? { color: '#ececf6' } : {},
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            ...(dark && { backgroundColor: 'rgba(255,255,255,0.035)', borderColor: 'rgba(255,255,255,0.07)' }),
          },
        },
      },

      MuiTypography: { styleOverrides: { root: dark ? { color: '#ececf6' } : {} } },
      MuiChip: { styleOverrides: { root: { fontWeight: 600, ...(dark && { color: '#ececf6' }) } } },

      MuiSelect: {
        styleOverrides: {
          root: dark ? { backgroundColor: 'rgba(255,255,255,0.04)', color: '#ececf6' } : {},
          icon: dark ? { color: '#a3a3bd' } : {},
        },
      },

      MuiMenu: { styleOverrides: { paper: { borderRadius: 14, boxShadow: '0 18px 48px rgba(0,0,0,0.18)' } } },
      MuiMenuItem: {
        styleOverrides: {
          root: dark
            ? {
                color: '#ececf6',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(102,126,234,0.14)',
                  '&:hover': { backgroundColor: 'rgba(102,126,234,0.20)' },
                },
              }
            : {},
        },
      },

      MuiInputLabel: { styleOverrides: { root: dark ? { color: '#a3a3bd' } : {} } },
      MuiDivider: { styleOverrides: { root: dark ? { borderColor: 'rgba(255,255,255,0.07)' } : {} } },

      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 12, ...(dark && { backgroundColor: 'rgba(255,255,255,0.05)', color: '#ececf6' }) },
        },
      },

      MuiSlider: {
        styleOverrides: {
          root: dark ? { color: BRAND } : {},
          rail: dark ? { backgroundColor: 'rgba(255,255,255,0.14)' } : {},
        },
      },

      MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 8, fontSize: '0.72rem' } } },

      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 20, ...(dark && { backgroundColor: '#151526' }) },
        },
      },
      MuiDialogTitle: { styleOverrides: { root: { fontWeight: 700, ...(dark && { color: '#ececf6' }) } } },
      MuiDialogContent: { styleOverrides: { root: dark ? { color: '#d2d2e2' } : {} } },
      MuiDialogContentText: { styleOverrides: { root: dark ? { color: '#b4b4cc' } : {} } },
    },
  });
};

// exported for any new component that wants the brand gradient
export const brandGradient = `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_2} 100%)`;