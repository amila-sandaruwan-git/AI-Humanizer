import React, { createContext, useMemo, useState, useRef } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { 
  CssBaseline, 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Button,
  Alert,
  Stack,
} from '@mui/material';
import {
  CheckCircle,
  Speed,
  Security,
  OfflineBolt,
  AutoAwesome,
  Help as HelpIcon,
  Info as InfoIcon,
  Keyboard,
  FileUpload,
  Palette,
  GitHub,
  Star,
} from '@mui/icons-material';
import Header from './components/Header';
import Editor from './components/Editor';
import { HumanizeResponse } from './types';
import { ToastProvider } from './context/ToastContext';
import { theme as createAppTheme } from './styles/theme';
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
    const savedMode = localStorage.getItem('colorMode');
    if (savedMode === 'dark' || savedMode === 'light') {
      return savedMode;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Refs for scrolling
  const aboutRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToHelp = () => {
    helpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const handleHumanize = (result: HumanizeResponse) => {
    console.log('Text humanized successfully:', result);
  };

  // About Section Content
  const AboutSection = () => (
    <Box ref={aboutRef} sx={{ scrollMarginTop: '80px' }}>
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <InfoIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            About AI Humanizer
          </Typography>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          AI Humanizer is a powerful, free, and offline tool designed to transform AI-generated content 
          into natural, human-like writing. Built with React and TypeScript, it uses an extensive dictionary 
          of over 5,000+ words and phrases to rewrite text while preserving meaning.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Speed color="primary" />
                <Typography variant="h6">How It Works</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                The tool uses a combination of:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="5,000+ word/phrase dictionary" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Smart sentence restructuring" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Active/passive voice conversion" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Grammar and tone adjustments" />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AutoAwesome color="secondary" />
                <Typography variant="h6">Features</Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="3 Intensity levels: Light, Medium, Heavy" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="4 Tone options: Professional, Casual, Academic, Creative" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="File upload support: TXT, DOCX, PDF" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Dark/Light mode, Undo/Redo, Copy/Download/Share" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          <Chip icon={<Security />} label="100% Private - No Data Sent" color="success" />
          <Chip icon={<OfflineBolt />} label="Works Offline" color="primary" />
          <Chip icon={<AutoAwesome />} label="Free to Use" color="secondary" />
          <Chip icon={<Star />} label="Open Source" color="warning" />
        </Box>
      </Paper>
    </Box>
  );

  // Help Section Content
  const HelpSection = () => (
    <Box ref={helpRef} sx={{ scrollMarginTop: '80px' }}>
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <HelpIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Help & User Guide
          </Typography>
        </Box>

        <Typography variant="body1" sx={{ mb: 2 }}>
          Learn how to use AI Humanizer effectively to transform your AI-generated content into natural,
          human-like text.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Keyboard color="primary" /> Getting Started
        </Typography>

        <List sx={{ mb: 3 }}>
          <ListItem>
            <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
            <ListItemText 
              primary="Enter or paste your text into the input box"
              secondary="You can also upload TXT, DOCX, or PDF files using the upload button"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
            <ListItemText 
              primary="Select your preferred settings"
              secondary="Choose Tone, Style, and Intensity level"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
            <ListItemText 
              primary="Click 'Humanize Text'"
              secondary="Wait a moment while your text is processed"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
            <ListItemText 
              primary="Review and copy the result"
              secondary="Use Copy, Download, or Share buttons to save your humanized text"
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Palette color="secondary" /> Customization Options
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Tone Options</Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary={<><strong>Professional</strong> - Formal business language</>} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={<><strong>Casual</strong> - Relaxed, conversational tone</>} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={<><strong>Academic</strong> - Scholarly and formal</>} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={<><strong>Creative</strong> - Descriptive and expressive</>} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Intensity Levels</Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary={<><strong>Light</strong> - 55% word replacement, gentle changes</>} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={<><strong>Medium</strong> - 75% word replacement, moderate restructuring</>} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={<><strong>Heavy</strong> - 98% word replacement, complete transformation</>} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Keyboard color="info" /> Keyboard Shortcuts
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle2">Ctrl + Z</Typography>
              <Typography variant="caption" color="text.secondary">Undo changes</Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle2">Ctrl + Y</Typography>
              <Typography variant="caption" color="text.secondary">Redo changes</Typography>
            </CardContent>
          </Card>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileUpload color="success" /> File Upload Support
        </Typography>

        <List dense>
          <ListItem>
            <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
            <ListItemText primary={<><strong>TXT</strong> - Plain text files</>} />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
            <ListItemText primary={<><strong>DOCX</strong> - Microsoft Word documents</>} />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
            <ListItemText primary={<><strong>PDF</strong> - PDF documents (text-based)</>} />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
            <ListItemText primary={<><strong>MD</strong> - Markdown files</>} />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Alert severity="info">
          <Typography variant="body2">
            💡 <strong>Pro Tip:</strong> For best results, review and personalize the humanized text 
            to match your unique voice and style. The tool is designed to assist, not replace, your creativity.
          </Typography>
        </Alert>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            startIcon={<GitHub />}
            href="https://github.com/yourusername/ai-humanizer"
            target="_blank"
          >
            View on GitHub
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Star />}
            onClick={() => window.open('https://github.com/yourusername/ai-humanizer/stargazers', '_blank')}
          >
            Star on GitHub
          </Button>
        </Box>
      </Paper>
    </Box>
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header onAboutClick={scrollToAbout} onHelpClick={scrollToHelp} />
            
            <Container component="main" sx={{ flex: 1, py: 4 }}>
              {/* Editor Section */}
              <Box ref={editorRef}>
                <Editor onHumanize={handleHumanize} />
              </Box>

              {/* About Section */}
              <AboutSection />

              {/* Help Section */}
              <HelpSection />
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
                  AI Humanizer - Transform AI text into human-like content • Made with ❤️
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