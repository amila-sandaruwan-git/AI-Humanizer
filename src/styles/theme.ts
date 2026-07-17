import { createTheme } from '@mui/material/styles';

export const theme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    ...(mode === 'dark'
      ? {
          primary: {
            main: '#90caf9',
            light: '#e3f2fd',
            dark: '#42a5f5',
          },
          secondary: {
            main: '#f48fb1',
            light: '#fce4ec',
            dark: '#f06292',
          },
          background: {
            default: '#121212',
            paper: '#1e1e1e',
          },
          text: {
            primary: '#e0e0e0',
            secondary: '#a0a0a0',
          },
          divider: 'rgba(255,255,255,0.12)',
        }
      : {
          primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
          },
          secondary: {
            main: '#dc004e',
            light: '#ff4081',
            dark: '#9a0036',
          },
          background: {
            default: '#f5f7fa',
            paper: '#ffffff',
          },
          text: {
            primary: '#1a1a2e',
            secondary: '#4a4a6a',
          },
          divider: 'rgba(0,0,0,0.12)',
        }),
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontFamily: 'Playfair Display, serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: 'Playfair Display, serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: 'Playfair Display, serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
    },
    body1: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '1rem',
      lineHeight: 1.7,
    },
    body2: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
      textTransform: 'none',
    },
    caption: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '0.75rem',
    },
    overline: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
          padding: '8px 20px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          ...(mode === 'dark' && {
            backgroundColor: '#1e1e1e',
            borderColor: 'rgba(255,255,255,0.12)',
          }),
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          backgroundColor: mode === 'dark' 
            ? 'rgba(18, 18, 18, 0.85)' 
            : 'rgba(255, 255, 255, 0.85)',
          borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            fontFamily: 'Inter, sans-serif',
            ...(mode === 'dark' && {
              backgroundColor: '#2d2d2d',
            }),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          ...(mode === 'dark' && {
            backgroundColor: '#2d2d2d',
            borderColor: 'rgba(255,255,255,0.12)',
          }),
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: 'Inter, sans-serif',
        },
      },
    },
  },
});