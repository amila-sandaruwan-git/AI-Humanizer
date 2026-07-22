import React, { createContext, useMemo, useState, useRef } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import {
  CssBaseline,
  Container,
  Box,
  Typography,
  Alert,
  Stack,
  Paper,
  Button,
} from '@mui/material';
import {
  Info as InfoIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import Header from './components/Header';
import Editor from './components/Editor';
import ScrollToTop from './components/ScrollToTop';
import { CommentSection } from './components/comments/CommentSection';
import { HumanizeResponse } from './types';
import { ToastProvider } from './context/ToastContext';
import { theme as createAppTheme } from './styles/theme';
import './App.css';

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

  const aboutRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToHelp = () => {
    helpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToFeedback = () => {
    feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const appTheme = useMemo(() => createAppTheme(mode), [mode]);

  const handleHumanize = (result: HumanizeResponse) => {
    console.log('Text humanized successfully:', result);
  };

  const gradientColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  const primaryColor = '#667eea';

  // About Section
  const AboutSection = () => (
    <Box ref={aboutRef} sx={{ scrollMarginTop: '80px', py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: gradientColor,
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
            mb: 2,
          }}
        >
          <InfoIcon sx={{ fontSize: 36, color: '#fff' }} />
        </Box>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
            letterSpacing: '-0.03em',
            background: gradientColor,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 1.5,
          }}
        >
          About AI Humanizer
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'text.secondary',
            fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
            fontSize: '1.1rem',
            maxWidth: 600,
            mx: 'auto',
            fontWeight: 400,
            lineHeight: 1.7,
          }}
        >
          A powerful, free, and offline tool designed to transform AI-generated content
          into natural, human-like writing. The tool works entirely offline, making it
          perfect for users who value privacy and want to avoid sending their content
          to external servers.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
        <Alert
          severity="info"
          sx={{
            borderRadius: 3,
            backgroundColor: mode === 'dark' ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.05)',
            border: '1px solid',
            borderColor: mode === 'dark' ? 'rgba(102,126,234,0.2)' : 'rgba(102,126,234,0.15)',
            '& .MuiAlert-icon': { color: primaryColor },
          }}
        >
          <Typography variant="body2" sx={{ fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif' }}>
            ✅ No login required • 100% free • Works offline • Your data stays private
          </Typography>
        </Alert>
      </Box>
    </Box>
  );

  // Help Section - Redesigned
  const HelpSection = () => {
    const helpCategories = [
      {
        icon: '🚀',
        title: 'Getting Started',
        description: 'Learn the basics of using AI Humanizer',
        items: [
          { label: 'What is AI Humanizer?', content: 'AI Humanizer is a powerful tool that transforms AI-generated text into natural, human-like content using a dictionary of over 5,000+ words and phrases.' },
          { label: 'How does it work?', content: 'Simply paste your AI-generated text, select your preferred tone and intensity, then click "Humanize Text". The tool will rewrite your content while preserving meaning.' },
          { label: 'Is it free?', content: 'Yes! AI Humanizer is completely free to use with no hidden costs or limitations.' },
        ]
      },
      {
        icon: '🎨',
        title: 'Customization',
        description: 'Adjust settings to get the perfect result',
        items: [
          { label: 'Tone Options', content: 'Choose from Professional, Casual, Academic, or Creative tones to match your writing style.' },
          { label: 'Intensity Levels', content: 'Light (55% changes), Medium (75% changes), or Heavy (98% changes) - choose how much you want to transform your text.' },
          { label: 'Style Settings', content: 'Select Concise, Balanced, or Detailed style to control the length and depth of your content.' },
        ]
      },
      {
        icon: '⌨️',
        title: 'Keyboard Shortcuts',
        description: 'Speed up your workflow with shortcuts',
        items: [
          { label: 'Undo', content: 'Press Ctrl + Z to undo your last action' },
          { label: 'Redo', content: 'Press Ctrl + Y or Ctrl + Shift + Z to redo an action' },
          { label: 'Quick Actions', content: 'Use keyboard shortcuts to navigate and interact with the tool faster.' },
        ]
      },
      {
        icon: '📁',
        title: 'File Upload',
        description: 'Import files directly into the editor',
        items: [
          { label: 'Supported Formats', content: 'Upload TXT, DOCX, PDF, and MD files directly into the editor.' },
          { label: 'File Size Limit', content: 'Maximum file size is 10MB per upload.' },
          { label: 'How to Upload', content: 'Click the upload icon in the toolbar or drag and drop files into the upload area.' },
        ]
      },
      {
        icon: '💡',
        title: 'Pro Tips',
        description: 'Get the most out of AI Humanizer',
        items: [
          { label: 'Review Your Text', content: 'Always review the humanized text and make personal adjustments for the best results.' },
          { label: 'Combine with Editing', content: 'Use the tool as a starting point, then refine the text with your own edits.' },
          { label: 'Save Your Work', content: 'Use the download or copy buttons to save your humanized content.' },
        ]
      },
      {
        icon: '🔒',
        title: 'Privacy & Security',
        description: 'Your data is safe with us',
        items: [
          { label: 'No Data Collection', content: 'We do not store or collect any of your text. Everything stays on your device.' },
          { label: 'Works Offline', content: 'The tool works entirely offline - no data is sent to external servers.' },
          { label: '100% Private', content: 'Your content remains completely private and secure.' },
        ]
      },
    ];

    const faqs = [
      { q: 'What types of text can I humanize?', a: 'Any AI-generated text, including blog posts, articles, essays, social media content, and more.' },
      { q: 'Will the meaning of my text change?', a: 'The meaning is preserved while the language becomes more natural and human-like.' },
      { q: 'Can I use this for commercial purposes?', a: 'Yes, AI Humanizer is completely free for both personal and commercial use.' },
      { q: 'How accurate is the humanization?', a: 'The tool uses a large dictionary and advanced rewriting techniques to produce natural results.' },
    ];

    return (
      <Box ref={helpRef} sx={{ scrollMarginTop: '80px', py: 6 }}>
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: gradientColor,
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
              mb: 2,
            }}
          >
            <HelpIcon sx={{ fontSize: 36, color: '#fff' }} />
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              letterSpacing: '-0.03em',
              background: gradientColor,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 1.5,
            }}
          >
            Help & User Guide
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              fontSize: '1.1rem',
              maxWidth: 600,
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.7,
            }}
          >
            Everything you need to know about using AI Humanizer effectively
          </Typography>
        </Box>

        {/* Quick Start Alert */}
        <Alert
          severity="info"
          sx={{
            borderRadius: 3,
            maxWidth: 700,
            mx: 'auto',
            mb: 4,
            backgroundColor: mode === 'dark' ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.05)',
            border: '1px solid',
            borderColor: mode === 'dark' ? 'rgba(102,126,234,0.2)' : 'rgba(102,126,234,0.15)',
            '& .MuiAlert-icon': { color: primaryColor },
          }}
        >
          <Typography variant="body2" sx={{ fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif', color: 'text.primary' }}>
            💡 <strong>Quick Start:</strong> Paste your text → Select tone & intensity → Click "Humanize Text" →
            Copy the result. It's that simple!
          </Typography>
        </Alert>

        {/* Help Categories Grid */}
        <Box sx={{ maxWidth: 1000, mx: 'auto', mb: 6 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              textAlign: 'center',
              mb: 3,
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              color: 'text.primary',
            }}
          >
            Help Categories
          </Typography>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            gap: 3,
          }}>
            {helpCategories.map((category, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: primaryColor,
                    boxShadow: `0 4px 20px ${mode === 'dark' ? 'rgba(102,126,234,0.15)' : 'rgba(102,126,234,0.1)'}`,
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Typography variant="h2" sx={{ fontSize: '2.5rem', mb: 1 }}>
                  {category.icon}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: 0.5,
                    fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                    color: 'text.primary',
                  }}
                >
                  {category.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: 'block',
                    mb: 1.5,
                    fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                  }}
                >
                  {category.description}
                </Typography>
                <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                  {category.items.map((item, idx) => (
                    <Box component="li" key={idx} sx={{ mb: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                          color: 'text.primary',
                          fontSize: '0.875rem',
                        }}
                      >
                        {item.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                          fontSize: '0.8125rem',
                          lineHeight: 1.6,
                        }}
                      >
                        {item.content}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>

        {/* FAQ Section */}
        <Box sx={{ maxWidth: 700, mx: 'auto' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              textAlign: 'center',
              mb: 3,
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              color: 'text.primary',
            }}
          >
            ❓ Frequently Asked Questions
          </Typography>

          <Stack spacing={2}>
            {faqs.map((faq, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: primaryColor,
                    boxShadow: `0 4px 20px ${mode === 'dark' ? 'rgba(102,126,234,0.15)' : 'rgba(102,126,234,0.1)'}`,
                  },
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    mb: 0.5,
                    fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                    color: 'text.primary',
                  }}
                >
                  {faq.q}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                    lineHeight: 1.7,
                  }}
                >
                  {faq.a}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Box>

        {/* Need More Help? */}
        <Box
          sx={{
            maxWidth: 700,
            mx: 'auto',
            mt: 4,
            p: 3,
            borderRadius: 3,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'divider',
            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif' }}>
            💬 Need More Help?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif' }}>
            Check out the About section or leave a comment below. We're here to help!
          </Typography>
          <Button
            variant="outlined"
            onClick={scrollToAbout}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              borderColor: primaryColor,
              color: primaryColor,
              '&:hover': {
                borderColor: primaryColor,
                backgroundColor: mode === 'dark' ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.05)',
              },
            }}
          >
            Go to About
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <ToastProvider toastOffsetTop={80}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
              width: '100%',
              maxWidth: '100vw',
              overflowX: 'hidden',
            }}
          >
            <Header
              onAboutClick={scrollToAbout}
              onHelpClick={scrollToHelp}
              onFeedbackClick={scrollToFeedback}
            />

            <Container
              component="main"
              maxWidth="lg"
              sx={{
                flex: 1,
                py: { xs: 2, sm: 3, md: 4 },
                px: { xs: 2, sm: 3, md: 4 },
                width: '100%',
                maxWidth: '100%',
              }}
            >
              <Box ref={editorRef}>
                <Editor onHumanize={handleHumanize} />
              </Box>

              <AboutSection />
              <HelpSection />

              {/* Comment Section */}
              <Box ref={feedbackRef} sx={{ scrollMarginTop: '80px', mt: 4 }}>
                <CommentSection />
              </Box>
            </Container>

            <Box
              component="footer"
              sx={{
                py: 4,
                textAlign: 'center',
                backgroundColor: mode === 'dark' ? '#121212' : 'background.paper',
                borderTop: 1,
                borderColor: 'divider',
                mt: 'auto',
              }}
            >
              <Container maxWidth="lg">
                <Typography variant="body2" color="text.secondary" sx={{
                  fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                }}>
                  AI Humanizer - Transform AI text into human-like content • No login required • 100% Free
                </Typography>
              </Container>
            </Box>

            <ScrollToTop threshold={300} />
          </Box>
        </ToastProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;