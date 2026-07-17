import React, { createContext, useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Box, Typography } from '@mui/material';
import Header from './components/Header';
import Editor from './components/Editor';
import { HumanizeResponse } from './types';
import { ToastProvider } from './context/ToastContext';
import './App.css';

// Create context for color mode
export const ColorModeContext = createContext<{
  toggleColorMode: () => void;
  mode: 'light' | 'dark';
}>({
  toggleColorMode: () => {},
  mode: 'light',
});

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    // Check localStorage for saved preference
    const savedMode = localStorage.getItem('colorMode');
    if (savedMode === 'dark' || savedMode === 'light') {
      return savedMode;
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('colorMode', newMode);
          return newMode;
        });
      },
      mode,
    }),
    [mode]
  );

  // Create theme based on mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'dark'
            ? {
                // Dark mode colors
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
                  default: '#121212', // Deep dark gray
                  paper: '#1e1e1e', // Slightly lighter dark
                },
                text: {
                  primary: '#e0e0e0',
                  secondary: '#a0a0a0',
                },
                divider: 'rgba(255,255,255,0.12)',
              }
            : {
                // Light mode colors
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
                  primary: '#333333',
                  secondary: '#666666',
                },
                divider: 'rgba(0,0,0,0.12)',
              }),
        },
        typography: {
          fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
          ].join(','),
          h5: {
            fontWeight: 600,
          },
          h6: {
            fontWeight: 600,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 600,
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
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
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
          MuiDivider: {
            styleOverrides: {
              root: {
                ...(mode === 'dark' && {
                  borderColor: 'rgba(255,255,255,0.12)',
                }),
              },
            },
          },
          MuiInputLabel: {
            styleOverrides: {
              root: {
                ...(mode === 'dark' && {
                  color: '#a0a0a0',
                }),
              },
            },
          },
          MuiSelect: {
            styleOverrides: {
              root: {
                ...(mode === 'dark' && {
                  backgroundColor: '#2d2d2d',
                }),
              },
            },
          },
          MuiMenuItem: {
            styleOverrides: {
              root: {
                ...(mode === 'dark' && {
                  backgroundColor: '#1e1e1e',
                  '&:hover': {
                    backgroundColor: '#2d2d2d',
                  },
                }),
              },
            },
          },
        },
      }),
    [mode]
  );

  const handleHumanize = (result: HumanizeResponse) => {
    console.log('Text humanized successfully:', result);
  };

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <Container component="main" sx={{ flex: 1, py: 4 }}>
              <Editor onHumanize={handleHumanize} />
            </Container>
            <Box 
              component="footer" 
              sx={{ 
                py: 3, 
                textAlign: 'center',
                backgroundColor: mode === 'dark' ? '#121212' : 'background.paper',
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <Container maxWidth="lg">
                <Typography variant="body2" color="text.secondary">
                  AI Humanizer - Transform AI text into human-like content
                </Typography>
              </Container>
            </Box>
          </Box>
        </ToastProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;