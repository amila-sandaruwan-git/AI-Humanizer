// src/App.tsx

import React, { createContext, useMemo, useState, useRef, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
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

const gradientColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
const primaryColor = '#5b6fd6';

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

  const scrollToAbout = useCallback(() => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToHelp = useCallback(() => {
    helpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToFeedback = useCallback(() => {
    feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

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

  const handleHumanize = useCallback((result: HumanizeResponse) => {
    console.log('Text humanized successfully:', result);
  }, []);

  // About Section
  const AboutSection = () => (
    <Box
      ref={aboutRef}
      sx={{
        scrollMarginTop: '80px',
        py: { xs: 4, sm: 5, md: 6 },
        px: { xs: 0, sm: 0 },
      }}
    >
      <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4, md: 5 } }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: { xs: 56, sm: 64, md: 72 },
            height: { xs: 56, sm: 64, md: 72 },
            borderRadius: '50%',
            background: gradientColor,
            mb: 2,
          }}
        >
          <InfoIcon sx={{ fontSize: { xs: 28, sm: 32, md: 36 }, color: '#fff' }} />
        </Box>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.65rem', sm: '2.1rem', md: '2.6rem' },
            fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
            letterSpacing: '-0.03em',
            background: gradientColor,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 1.5,
            px: { xs: 1, sm: 0 },
          }}
        >
          About AI Humanizer
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'text.secondary',
            fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
            fontSize: { xs: '0.9375rem', sm: '1rem', md: '1.1rem' },
            maxWidth: 600,
            mx: 'auto',
            fontWeight: 400,
            lineHeight: 1.7,
            px: { xs: 2, sm: 1, md: 0 },
          }}
        >
          A powerful, free, and offline tool designed to transform AI-generated content
          into natural, human-like writing. The tool works entirely offline, making it
          perfect for users who value privacy and want to avoid sending their content
          to external servers.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'center',
          px: { xs: 1, sm: 0 },
        }}
      >
        <Alert
          severity="info"
          sx={{
            borderRadius: 3,
            width: { xs: '100%', sm: 'auto' },
            backgroundColor:
              mode === 'dark' ? 'rgba(102,126,234,0.1)' : 'rgba(91,111,214,0.07)',
            border: '1px solid',
            borderColor:
              mode === 'dark' ? 'rgba(102,126,234,0.2)' : 'rgba(91,111,214,0.18)',
            '& .MuiAlert-icon': { color: primaryColor },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            }}
          >
            No login required - 100% free - Works offline - Your data stays private
          </Typography>
        </Alert>
      </Box>
    </Box>
  );

  // Help Section
  const HelpSection = () => {
    const helpCategories = [
      {
        icon: '01',
        title: 'Getting Started',
        description: 'Learn the basics of using AI Humanizer',
        items: [
          {
            label: 'What is AI Humanizer?',
            content:
              'AI Humanizer is a powerful tool that transforms AI-generated text into natural, human-like content using a dictionary of over 5,000+ words and phrases.',
          },
          {
            label: 'How does it work?',
            content:
              'Simply paste your AI-generated text, select your preferred tone and intensity, then click "Humanize Text". The tool will rewrite your content while preserving meaning.',
          },
          {
            label: 'Is it free?',
            content:
              'Yes! AI Humanizer is completely free to use with no hidden costs or limitations.',
          },
        ],
      },
      {
        icon: '02',
        title: 'Customization',
        description: 'Adjust settings to get the perfect result',
        items: [
          {
            label: 'Tone Options',
            content:
              'Choose from Professional, Casual, Academic, or Creative tones to match your writing style.',
          },
          {
            label: 'Intensity Levels',
            content:
              'Light (55% changes), Medium (75% changes), or Heavy (98% changes) - choose how much you want to transform your text.',
          },
          {
            label: 'Style Settings',
            content:
              'Select Concise, Balanced, or Detailed style to control the length and depth of your content.',
          },
        ],
      },
      {
        icon: '03',
        title: 'Keyboard Shortcuts',
        description: 'Speed up your workflow with shortcuts',
        items: [
          { label: 'Undo', content: 'Press Ctrl + Z to undo your last action' },
          {
            label: 'Redo',
            content: 'Press Ctrl + Y or Ctrl + Shift + Z to redo an action',
          },
          {
            label: 'Quick Actions',
            content:
              'Use keyboard shortcuts to navigate and interact with the tool faster.',
          },
        ],
      },
      {
        icon: '04',
        title: 'File Upload',
        description: 'Import files directly into the editor',
        items: [
          {
            label: 'Supported Formats',
            content: 'Upload TXT, DOCX, PDF, and MD files directly into the editor.',
          },
          { label: 'File Size Limit', content: 'Maximum file size is 10MB per upload.' },
          {
            label: 'How to Upload',
            content:
              'Click the upload icon in the toolbar or drag and drop files into the upload area.',
          },
        ],
      },
      {
        icon: '05',
        title: 'Pro Tips',
        description: 'Get the most out of AI Humanizer',
        items: [
          {
            label: 'Review Your Text',
            content:
              'Always review the humanized text and make personal adjustments for the best results.',
          },
          {
            label: 'Combine with Editing',
            content:
              'Use the tool as a starting point, then refine the text with your own edits.',
          },
          {
            label: 'Save Your Work',
            content: 'Use the download or copy buttons to save your humanized content.',
          },
        ],
      },
      {
        icon: '06',
        title: 'Privacy & Security',
        description: 'Your data is safe with us',
        items: [
          {
            label: 'No Data Collection',
            content:
              'We do not store or collect any of your text. Everything stays on your device.',
          },
          {
            label: 'Works Offline',
            content:
              'The tool works entirely offline - no data is sent to external servers.',
          },
          {
            label: '100% Private',
            content: 'Your content remains completely private and secure.',
          },
        ],
      },
    ];

    const faqs = [
      {
        q: 'What types of text can I humanize?',
        a: 'Any AI-generated text, including blog posts, articles, essays, social media content, and more.',
      },
      {
        q: 'Will the meaning of my text change?',
        a: 'The meaning is preserved while the language becomes more natural and human-like.',
      },
      {
        q: 'Can I use this for commercial purposes?',
        a: 'Yes, AI Humanizer is completely free for both personal and commercial use.',
      },
      {
        q: 'How accurate is the humanization?',
        a: 'The tool uses a large dictionary and advanced rewriting techniques to produce natural results.',
      },
    ];

    return (
      <Box
        ref={helpRef}
        sx={{
          scrollMarginTop: '80px',
          py: { xs: 4, sm: 5, md: 6 },
        }}
      >
        <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4, md: 5 } }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 56, sm: 64, md: 72 },
              height: { xs: 56, sm: 64, md: 72 },
              borderRadius: '50%',
              background: gradientColor,
              mb: 2,
            }}
          >
            <HelpIcon sx={{ fontSize: { xs: 28, sm: 32, md: 36 }, color: '#fff' }} />
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.65rem', sm: '2.1rem', md: '2.6rem' },
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              letterSpacing: '-0.03em',
              background: gradientColor,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 1.5,
              px: { xs: 1, sm: 0 },
            }}
          >
            Help & User Guide
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              fontSize: { xs: '0.9375rem', sm: '1rem', md: '1.1rem' },
              maxWidth: 600,
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.7,
              px: { xs: 2, sm: 1, md: 0 },
            }}
          >
            Everything you need to know about using AI Humanizer effectively
          </Typography>
        </Box>

        <Alert
          severity="info"
          sx={{
            borderRadius: 3,
            maxWidth: 700,
            mx: 'auto',
            mb: { xs: 3, sm: 4 },
            px: { xs: 1.5, sm: 2 },
            backgroundColor:
              mode === 'dark' ? 'rgba(102,126,234,0.1)' : 'rgba(91,111,214,0.07)',
            border: '1px solid',
            borderColor:
              mode === 'dark' ? 'rgba(102,126,234,0.2)' : 'rgba(91,111,214,0.18)',
            '& .MuiAlert-icon': { color: primaryColor },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              color: 'text.primary',
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            }}
          >
            <strong>Quick Start:</strong> Paste your text, select tone & intensity, click
            "Humanize Text", then copy the result. It is that simple.
          </Typography>
        </Alert>

        <Box sx={{ maxWidth: 1000, mx: 'auto', mb: { xs: 4, sm: 5, md: 6 } }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              textAlign: 'center',
              mb: { xs: 2, sm: 3 },
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              color: 'text.primary',
              fontSize: { xs: '1.15rem', sm: '1.35rem', md: '1.5rem' },
            }}
          >
            Help Categories
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr',
              },
              gap: { xs: 2, sm: 2.5, md: 3 },
            }}
          >
            {helpCategories.map((category, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 2.5, md: 3 },
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor:
                    mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)',
                  '&:hover': {
                    borderColor: primaryColor,
                  },
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: { xs: '1.5rem', sm: '1.65rem', md: '1.75rem' },
                    mb: 1,
                    fontWeight: 800,
                    background: gradientColor,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {category.icon}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: 0.5,
                    fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                    color: 'text.primary',
                    fontSize: { xs: '1rem', sm: '1.05rem' },
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
                    fontSize: '0.75rem',
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

        <Box sx={{ maxWidth: 700, mx: 'auto' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              textAlign: 'center',
              mb: { xs: 2, sm: 3 },
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              color: 'text.primary',
              fontSize: { xs: '1.15rem', sm: '1.35rem', md: '1.5rem' },
            }}
          >
            Frequently Asked Questions
          </Typography>

          <Stack spacing={{ xs: 1.5, sm: 2 }}>
            {faqs.map((faq, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 2.5, md: 3 },
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor:
                    mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)',
                  '&:hover': {
                    borderColor: primaryColor,
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
                    fontSize: { xs: '0.9375rem', sm: '1rem' },
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
                    fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                  }}
                >
                  {faq.a}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Box>

        <Box
          sx={{
            maxWidth: 700,
            mx: 'auto',
            mt: { xs: 3, sm: 4 },
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'divider',
            backgroundColor:
              mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 1,
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              fontSize: { xs: '1rem', sm: '1.15rem' },
            }}
          >
            Need More Help?
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            }}
          >
            Check out the About section or leave a comment below. We are here to help.
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
                backgroundColor:
                  mode === 'dark'
                    ? 'rgba(102,126,234,0.1)'
                    : 'rgba(91,111,214,0.06)',
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
                pt: { xs: 9, sm: 10, md: 11 },
                pb: { xs: 2, sm: 3, md: 4 },
                px: { xs: 1.5, sm: 2, md: 3 },
                width: '100%',
                maxWidth: '100%',
                overflow: 'visible',
              }}
            >
              <Box ref={editorRef} sx={{ mt: { xs: 1, sm: 1.5, md: 2 } }}>
                <Editor onHumanize={handleHumanize} />
              </Box>

              <AboutSection />
              <HelpSection />

              <Box
                ref={feedbackRef}
                sx={{ scrollMarginTop: '80px', mt: { xs: 3, sm: 4 } }}
              >
                <CommentSection />
              </Box>
            </Container>

            <Box
              component="footer"
              sx={{
                py: { xs: 3, sm: 4 },
                px: { xs: 1.5, sm: 2 },
                textAlign: 'center',
                backgroundColor: mode === 'dark' ? '#121212' : 'background.paper',
                borderTop: 1,
                borderColor: 'divider',
                mt: 'auto',
                pb: {
                  xs: 'calc(20px + env(safe-area-inset-bottom))',
                  sm: 3,
                },
              }}
            >
              <Container maxWidth="lg">
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    lineHeight: 1.6,
                  }}
                >
                  AI Humanizer - Transform AI text into human-like content - No login
                  required - 100% Free
                </Typography>
              </Container>
            </Box>

            <ScrollToTop threshold={300} />
          </Box>
        </ToastProvider>
      </ThemeProvider>
      <Analytics />
      <SpeedInsights />
    </ColorModeContext.Provider>
  );
}

export default App;