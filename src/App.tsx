import React, { createContext, useMemo, useState, useRef, useEffect } from 'react';
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
  useTheme,
  alpha,
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
  Layers,
  Bolt,
  Shield,
  Code,
  PlayArrow,
  Settings,
  Description,
  Download,
} from '@mui/icons-material';
import Header from './components/Header';
import Editor from './components/Editor';
import ScrollToTop from './components/ScrollToTop';
import { HumanizeResponse } from './types';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginDialog } from './components/LoginDialog';
import { CommentSection } from './components/comments/CommentSection';
import { theme as createAppTheme } from './styles/theme';
import './App.css';

export const ColorModeContext = createContext<{
  toggleColorMode: () => void;
  mode: 'light' | 'dark';
}>({
  toggleColorMode: () => {},
  mode: 'light',
});

// Main App Content
const AppContent: React.FC = () => {
  const { user, loading, refreshSession } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  
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

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const aboutRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

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

  const isAuthenticated = !!user;

  useEffect(() => {
    if (refreshSession) {
      refreshSession();
    }
  }, [refreshSession]);

  useEffect(() => {
    if (user) {
      console.log('✅ User logged in:', user.email);
    } else if (!loading) {
      console.log('❌ No user logged in');
    }
  }, [user, loading]);

  const gradientColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  const primaryColor = '#667eea';

  // Handle login click from Header
  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };

  // Handle auth required from CommentSection
  const handleAuthRequired = () => {
    setLoginDialogOpen(true);
  };

  // About Section
  const AboutSection = () => {
    const features = [
      { icon: <Layers />, title: '5,000+ Word Dictionary', description: 'Extensive vocabulary for natural rewriting' },
      { icon: <Bolt />, title: 'Smart Restructuring', description: 'Intelligent sentence transformation' },
      { icon: <Shield />, title: 'Voice Conversion', description: 'Active/passive voice adjustment' },
      { icon: <Code />, title: 'Grammar & Tone', description: 'Professional tone and grammar optimization' },
    ];

    const stats = [
      { value: '5,000+', label: 'Words in Dictionary' },
      { value: '3', label: 'Intensity Levels' },
      { value: '4', label: 'Tone Options' },
      { value: '100%', label: 'Private & Offline' },
    ];

    return (
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
            into natural, human-like writing.
            The tool works entirely offline after the initial login, making it perfect for users who value 
            privacy and want to avoid sending their content to external servers. 
          </Typography>
        </Box>

        <Stack 
          direction={{ xs: 'row', sm: 'row' }} 
          spacing={2} 
          sx={{ 
            mb: 5, 
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {stats.map((stat, index) => (
            <Box
              key={index}
              sx={{
                flex: { xs: '1 1 45%', sm: '1 1 22%' },
                minWidth: { xs: '100px', sm: '140px' },
                maxWidth: { xs: '180px', sm: '200px' },
                textAlign: 'center',
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: primaryColor,
                  boxShadow: `0 4px 20px ${isDark ? 'rgba(102,126,234,0.15)' : 'rgba(102,126,234,0.1)'}`,
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 800,
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                  background: gradientColor,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: 0.5,
                }}
              >
                {stat.value}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Stack 
          direction={{ xs: 'column', sm: 'row', md: 'row' }} 
          spacing={3} 
          sx={{ 
            mb: 4, 
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {features.map((feature, index) => (
            <Card
              key={index}
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' },
                minWidth: { xs: '100%', sm: '200px', md: '220px' },
                maxWidth: { xs: '100%', sm: '280px', md: '280px' },
                textAlign: 'center',
                p: 2,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: primaryColor,
                  boxShadow: `0 4px 20px ${isDark ? 'rgba(102,126,234,0.15)' : 'rgba(102,126,234,0.1)'}`,
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: isDark ? 'rgba(102,126,234,0.15)' : 'rgba(102,126,234,0.1)',
                    color: primaryColor,
                    mb: 1.5,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700,
                    fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                    fontSize: '1rem',
                    mb: 0.5,
                    color: 'text.primary',
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                  }}
                >
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          <Chip 
            icon={<Security />} 
            label="100% Private - No Data Sent" 
            sx={{ 
              backgroundColor: isDark ? 'rgba(102,126,234,0.15)' : 'rgba(102,126,234,0.08)',
              color: primaryColor,
              fontWeight: 600,
              border: '1px solid',
              borderColor: isDark ? 'rgba(102,126,234,0.25)' : 'rgba(102,126,234,0.15)',
              '& .MuiChip-icon': { color: primaryColor },
            }}
          />
          <Chip 
            icon={<OfflineBolt />} 
            label="Works Offline" 
            sx={{ 
              backgroundColor: isDark ? 'rgba(102,126,234,0.15)' : 'rgba(102,126,234,0.08)',
              color: primaryColor,
              fontWeight: 600,
              border: '1px solid',
              borderColor: isDark ? 'rgba(102,126,234,0.25)' : 'rgba(102,126,234,0.15)',
              '& .MuiChip-icon': { color: primaryColor },
            }}
          />
          <Chip 
            icon={<AutoAwesome />} 
            label="Free to Use" 
            sx={{ 
              backgroundColor: isDark ? 'rgba(102,126,234,0.15)' : 'rgba(102,126,234,0.08)',
              color: primaryColor,
              fontWeight: 600,
              border: '1px solid',
              borderColor: isDark ? 'rgba(102,126,234,0.25)' : 'rgba(102,126,234,0.15)',
              '& .MuiChip-icon': { color: primaryColor },
            }}
          />
          <Chip 
            icon={<Star />} 
            label="Open Source" 
            sx={{ 
              backgroundColor: isDark ? 'rgba(102,126,234,0.15)' : 'rgba(102,126,234,0.08)',
              color: primaryColor,
              fontWeight: 600,
              border: '1px solid',
              borderColor: isDark ? 'rgba(102,126,234,0.25)' : 'rgba(102,126,234,0.15)',
              '& .MuiChip-icon': { color: primaryColor },
            }}
          />
        </Box>
      </Box>
    );
  };

  // Help Section
  const HelpSection = () => {
    const steps = [
      { icon: <Description />, title: 'Enter or Paste Text', description: 'Paste your AI-generated text into the editor or upload a file (TXT, DOCX, PDF, MD)' },
      { icon: <Settings />, title: 'Customize Settings', description: 'Choose your preferred Tone, Style, and Intensity level' },
      { icon: <PlayArrow />, title: 'Humanize Text', description: 'Click the Humanize Text button and wait a moment for processing' },
      { icon: <Download />, title: 'Review & Export', description: 'Review the humanized result, then copy, download, or share it' },
    ];

    const toneOptions = [
      { label: 'Professional', description: 'Formal business language for corporate and official communication' },
      { label: 'Casual', description: 'Relaxed, conversational tone for social and informal content' },
      { label: 'Academic', description: 'Scholarly and formal language for research and academic writing' },
      { label: 'Creative', description: 'Descriptive and expressive language for creative writing' },
    ];

    const fileTypes = [
      { ext: 'TXT', label: 'Plain text files' },
      { ext: 'DOCX', label: 'Microsoft Word documents' },
      { ext: 'PDF', label: 'PDF documents (text-based)' },
      { ext: 'MD', label: 'Markdown files' },
    ];

    const shortcuts = [
      { keys: 'Ctrl + Z', action: 'Undo changes' },
      { keys: 'Ctrl + Y', action: 'Redo changes' },
      { keys: 'Ctrl + Shift + Z', action: 'Redo changes (alternative)' },
    ];

    return (
      <Box ref={helpRef} sx={{ scrollMarginTop: '80px', py: 6 }}>
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
            Learn how to use AI Humanizer effectively to transform your AI-generated content 
            into natural, human-like text.
          </Typography>
        </Box>

        <Typography 
          variant="h5" 
          sx={{ 
            textAlign: 'center',
            fontWeight: 700,
            fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
            mb: 3,
            color: 'text.primary',
          }}
        >
          Getting Started
        </Typography>

        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={3} 
          sx={{ 
            mb: 5,
            justifyContent: 'center',
          }}
        >
          {steps.map((step, index) => (
            <Card
              key={index}
              sx={{
                flex: '1',
                minWidth: { xs: '100%', md: '200px' },
                maxWidth: { xs: '100%', md: '280px' },
                textAlign: 'center',
                p: 2,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                transition: 'all 0.3s ease',
                position: 'relative',
                '&:hover': {
                  borderColor: primaryColor,
                  boxShadow: `0 4px 20px ${isDark ? 'rgba(102,126,234,0.15)' : 'rgba(102,126,234,0.1)'}`,
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: isDark ? 'rgba(102,126,234,0.15)' : 'rgba(102,126,234,0.1)',
                    color: primaryColor,
                    mb: 1.5,
                  }}
                >
                  {step.icon}
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 16,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: primaryColor,
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {index + 1}
                </Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700,
                    fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                    fontSize: '0.9375rem',
                    mb: 0.5,
                    color: 'text.primary',
                  }}
                >
                  {step.title}
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
                  {step.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>

        <Divider sx={{ my: 4 }} />

        <Typography 
          variant="h5" 
          sx={{ 
            textAlign: 'center',
            fontWeight: 700,
            fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
            mb: 3,
            color: 'text.primary',
          }}
        >
          Customization Options
        </Typography>

        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={3} 
          sx={{ 
            mb: 5,
            justifyContent: 'center',
          }}
        >
          <Card
            sx={{
              flex: '1',
              maxWidth: { xs: '100%', md: '500px' },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              mx: 'auto',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Palette sx={{ color: primaryColor }} />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', color: 'text.primary' }}>
                  Tone Options
                </Typography>
              </Box>
              <Stack spacing={1.5}>
                {toneOptions.map((tone, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <CheckCircle sx={{ fontSize: 16, color: primaryColor, mt: 0.25 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
                        {tone.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                        {tone.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Divider sx={{ my: 4 }} />

        <Typography 
          variant="h5" 
          sx={{ 
            textAlign: 'center',
            fontWeight: 700,
            fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
            mb: 3,
            color: 'text.primary',
          }}
        >
          File Upload Support
        </Typography>

        <Stack 
          direction={{ xs: 'row' }} 
          spacing={2} 
          sx={{ 
            mb: 5,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {fileTypes.map((file, index) => (
            <Chip
              key={index}
              icon={<FileUpload />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.primary' }}>
                    {file.ext}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    {file.label}
                  </Typography>
                </Box>
              }
              sx={{
                backgroundColor: isDark ? 'rgba(102,126,234,0.15)' : 'rgba(102,126,234,0.08)',
                color: primaryColor,
                border: '1px solid',
                borderColor: isDark ? 'rgba(102,126,234,0.25)' : 'rgba(102,126,234,0.15)',
                py: 1.5,
                height: 'auto',
                '& .MuiChip-label': { py: 0.5 },
                '& .MuiChip-icon': { color: primaryColor },
              }}
            />
          ))}
        </Stack>

        <Divider sx={{ my: 4 }} />

        <Typography 
          variant="h5" 
          sx={{ 
            textAlign: 'center',
            fontWeight: 700,
            fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
            mb: 3,
            color: 'text.primary',
          }}
        >
          Keyboard Shortcuts
        </Typography>

        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ 
            mb: 4,
            justifyContent: 'center',
          }}
        >
          {shortcuts.map((shortcut, index) => (
            <Card
              key={index}
              sx={{
                flex: '1',
                maxWidth: { xs: '100%', sm: '200px' },
                textAlign: 'center',
                p: 2,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                  fontSize: '0.875rem',
                  color: primaryColor,
                  mb: 0.5,
                }}
              >
                {shortcut.keys}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                  fontSize: '0.75rem',
                }}
              >
                {shortcut.action}
              </Typography>
            </Card>
          ))}
        </Stack>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ maxWidth: 700, mx: 'auto' }}>
          <Alert 
            severity="info" 
            sx={{ 
              borderRadius: 3,
              backgroundColor: isDark ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.05)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(102,126,234,0.2)' : 'rgba(102,126,234,0.15)',
              '& .MuiAlert-icon': { color: primaryColor },
            }}
          >
            <Typography variant="body2" sx={{ fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif', color: 'text.primary' }}>
              💡 <strong>Pro Tip:</strong> For best results, review and personalize the humanized text 
              to match your unique voice and style. The tool is designed to assist, not replace, your creativity.
            </Typography>
          </Alert>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', mt: 3 }}>
          <Button 
            variant="outlined" 
            startIcon={<GitHub />}
            href="https://github.com/yourusername/ai-humanizer"
            target="_blank"
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                borderColor: primaryColor,
                color: primaryColor,
                backgroundColor: isDark ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.05)',
              },
            }}
          >
            View on GitHub
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Star />}
            onClick={() => window.open('https://github.com/yourusername/ai-humanizer/stargazers', '_blank')}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                borderColor: primaryColor,
                color: primaryColor,
                backgroundColor: isDark ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.05)',
              },
            }}
          >
            Star on GitHub
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <ToastProvider>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header 
              onAboutClick={scrollToAbout} 
              onHelpClick={scrollToHelp}
              onFeedbackClick={scrollToFeedback}
              onLoginClick={handleLoginClick}
            />
            
            <Container component="main" sx={{ flex: 1, py: 4 }}>
              <Box ref={editorRef}>
                <Editor 
                  onHumanize={handleHumanize} 
                  isAuthenticated={isAuthenticated}
                  onAuthRequired={handleAuthRequired}
                />
              </Box>

              <AboutSection />
              <HelpSection />

              <Box ref={feedbackRef} sx={{ scrollMarginTop: '80px' }}>
                <CommentSection 
                  onAuthRequired={handleAuthRequired}
                />
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
              }}
            >
              <Container maxWidth="lg">
                <Typography variant="body2" color="text.secondary" sx={{
                  fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                }}>
                  AI Humanizer - Transform AI text into human-like content • Made with ❤️
                </Typography>
              </Container>
            </Box>

            <LoginDialog 
              open={loginDialogOpen} 
              onClose={() => setLoginDialogOpen(false)} 
            />

            {/* Scroll to Top Button */}
            <ScrollToTop threshold={300} />
          </Box>
        </ToastProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;