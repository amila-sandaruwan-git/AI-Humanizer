// src/styles/theme.ts


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
            default: '#0f0f1a', // Darker background
            paper: '#1a1a2e', // Darker paper
          },
          text: {
            primary: '#e8e8f0', // Softer white
            secondary: '#a0a0b8', // Muted gray
          },
          divider: 'rgba(255,255,255,0.06)',
        }
      : {
          primary: {
            main: '#667eea',
            light: '#818cf8',
            dark: '#4f46e5',
          },
          secondary: {
            main: '#dc004e',
            light: '#ff4081',
            dark: '#9a0036',
          },
          background: {
            default: '#f0f2f5', // Softer background
            paper: '#ffffff',
          },
          text: {
            primary: '#1a1a2e', // Darker text
            secondary: '#4a4a6a', // Softer secondary
          },
          divider: 'rgba(0,0,0,0.06)',
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
      fontFamily: 'Inter, sans-serif',
      fontWeight: 700,
      color: mode === 'dark' ? '#e8e8f0' : '#1a1a2e',
    },
    h2: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 700,
      color: mode === 'dark' ? '#e8e8f0' : '#1a1a2e',
    },
    h3: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
      color: mode === 'dark' ? '#e8e8f0' : '#1a1a2e',
    },
    h4: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
      color: mode === 'dark' ? '#e8e8f0' : '#1a1a2e',
    },
    h5: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
      color: mode === 'dark' ? '#e8e8f0' : '#1a1a2e',
    },
    h6: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
      color: mode === 'dark' ? '#e8e8f0' : '#1a1a2e',
    },
    body1: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '1rem',
      lineHeight: 1.7,
      color: mode === 'dark' ? '#d0d0dd' : '#1a1a2e',
    },
    body2: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: mode === 'dark' ? '#b0b0c8' : '#2a2a4e',
    },
    button: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
      textTransform: 'none',
    },
    caption: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '0.75rem',
      color: mode === 'dark' ? '#9090a8' : '#4a4a6a',
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
          color: mode === 'dark' ? '#e8e8f0' : '#1a1a2e',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          ...(mode === 'dark' && {
            backgroundColor: '#1a1a2e',
            borderColor: 'rgba(255,255,255,0.06)',
          }),
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          backgroundColor: mode === 'dark' 
            ? 'rgba(15, 15, 26, 0.85)' 
            : 'rgba(255, 255, 255, 0.85)',
          borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
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
              backgroundColor: 'rgba(255,255,255,0.04)',
              color: '#e8e8f0',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.08)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.15)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#667eea',
              },
            }),
          },
          '& .MuiInputLabel-root': {
            ...(mode === 'dark' && {
              color: '#a0a0b8',
              '&.Mui-focused': {
                color: '#90caf9',
              },
            }),
          },
          '& .MuiInputBase-input': {
            ...(mode === 'dark' && {
              color: '#e8e8f0',
            }),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          ...(mode === 'dark' && {
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.06)',
          }),
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: 'Inter, sans-serif',
          ...(mode === 'dark' && {
            color: '#e8e8f0',
          }),
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          ...(mode === 'dark' && {
            color: '#e8e8f0',
          }),
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          ...(mode === 'dark' && {
            backgroundColor: 'rgba(255,255,255,0.04)',
            color: '#e8e8f0',
          }),
        },
        icon: {
          ...(mode === 'dark' && {
            color: '#a0a0b8',
          }),
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          ...(mode === 'dark' && {
            color: '#e8e8f0',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.04)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(102,126,234,0.12)',
              '&:hover': {
                backgroundColor: 'rgba(102,126,234,0.16)',
              },
            },
          }),
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          ...(mode === 'dark' && {
            color: '#a0a0b8',
          }),
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          ...(mode === 'dark' && {
            borderColor: 'rgba(255,255,255,0.06)',
          }),
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          ...(mode === 'dark' && {
            backgroundColor: 'rgba(255,255,255,0.04)',
            color: '#e8e8f0',
          }),
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          ...(mode === 'dark' && {
            color: '#667eea',
          }),
        },
        rail: {
          ...(mode === 'dark' && {
            backgroundColor: 'rgba(255,255,255,0.12)',
          }),
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          ...(mode === 'dark' && {
            backgroundColor: '#1a1a2e',
          }),
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          ...(mode === 'dark' && {
            color: '#e8e8f0',
          }),
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          ...(mode === 'dark' && {
            color: '#d0d0dd',
          }),
        },
      },
    },
    MuiDialogContentText: {
      styleOverrides: {
        root: {
          ...(mode === 'dark' && {
            color: '#b0b0c8',
          }),
        },
      },
    },
  },
});