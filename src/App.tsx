import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Container, Box, Typography } from '@mui/material'; // Added Typography
import Header from './components/Header';
import Editor from './components/Editor';
import { theme } from './styles/theme';
import { HumanizeResponse } from './types';
import './App.css';

function App() {
  const handleHumanize = (result: HumanizeResponse) => {
    console.log('Text humanized successfully:', result);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
            backgroundColor: 'background.paper',
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
    </ThemeProvider>
  );
}

export default App;