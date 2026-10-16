// src/components/Editor.tsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Paper,
  Typography,
  Slider,
  IconButton,
  Tooltip,
  Collapse,
  Divider,
  alpha,
  useTheme,
  Drawer,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Undo,
  Redo,
  Clear,
  UploadFile,
  Close,
  AutoAwesome,
  Tune,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { humanizeText } from '../services/aiService';
import { HumanizeResponse, ToneType, StyleType, IntensityType } from '../types';
import ResultDisplay from './ResultDisplay';
import FileUpload from './FileUpload';
import { useToast } from '../context/ToastContext';
import { useUndo } from '../hooks/useUndo';

interface EditorProps {
  onHumanize: (result: HumanizeResponse) => void;
}

const SIDEBAR_WIDTH = 320;

const Editor: React.FC<EditorProps> = ({ onHumanize }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const [tone, setTone] = useState<ToneType>('professional');
  const [style, setStyle] = useState<StyleType>('balanced');
  const [intensity, setIntensity] = useState<IntensityType>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HumanizeResponse | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Desktop still uses collapsible sections
  const [toneOpen, setToneOpen] = useState(true);
  const [styleOpen, setStyleOpen] = useState(true);
  const [intensityOpen, setIntensityOpen] = useState(true);

  const resultRef = useRef<HTMLDivElement>(null);

  // Swipe-down-to-close refs
  const touchStartY = useRef<number | null>(null);

  const {
    value: text,
    setValue: setText,
    setValueImmediate: setTextImmediate,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  } = useUndo<string>('', { maxHistory: 100 });

  const { showSuccess, showError, showInfo, showLoading, dismissToast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const previousText = undo();
        if (previousText !== undefined) showInfo('Undo');
        return;
      }

      if (isCtrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        const nextText = redo();
        if (nextText !== undefined) showInfo('Redo');
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [undo, redo, showInfo]);

  const handleUndo = useCallback(() => {
    const previousText = undo();
    if (previousText !== undefined) showInfo('Undo');
  }, [undo, showInfo]);

  const handleRedo = useCallback(() => {
    const nextText = redo();
    if (nextText !== undefined) showInfo('Redo');
  }, [redo, showInfo]);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setText(e.target.value);
    },
    [setText]
  );

  const handleFileContent = useCallback(
    (content: string, name: string) => {
      const newText = text ? text + '\n\n' + content : content;
      setTextImmediate(newText);
      setFileName(name);
      setShowFileUpload(false);
      showInfo(`File "${name}" loaded`);
    },
    [text, setTextImmediate, showInfo]
  );

  const handleFileUploadClick = useCallback(() => {
    setShowFileUpload((prev) => !prev);
  }, []);

  const handleRemoveFileContent = useCallback(() => {
    if (!fileName) return;
    const marker = `=== ${fileName}`;
    const lines = text.split('\n');
    let start = -1;
    let end = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(marker)) start = i;
      if (start !== -1 && lines[i].startsWith('===') && i > start) {
        end = i;
        break;
      }
    }

    if (start !== -1 && end !== -1) {
      const before = lines.slice(0, start).join('\n');
      const after = lines.slice(end + 1).join('\n');
      const newText = [before, after].filter((s) => s.trim()).join('\n\n');
      setTextImmediate(newText);
      setFileName(null);
      showInfo('File content removed');
    }
  }, [fileName, text, setTextImmediate, showInfo]);

  const handleHumanize = useCallback(async () => {
    if (!text.trim()) {
      setError('Please enter some text to humanize');
      showError('Please enter some text to humanize');
      return;
    }

    setLoading(true);
    setError(null);
    const toastId = showLoading('Humanizing your text...');

    try {
      const response = await humanizeText({ text, tone, style, intensity });
      setResult(response);
      onHumanize(response);
      dismissToast(toastId);
      showSuccess('Text humanized successfully');

      // Close mobile settings drawer after humanizing so user sees result
      if (isMobile) setMobileSidebarOpen(false);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    } catch (err) {
      dismissToast(toastId);
      setError('Failed to humanize text. Please try again.');
      showError('Failed to humanize text. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [
    text,
    tone,
    style,
    intensity,
    isMobile,
    onHumanize,
    showLoading,
    dismissToast,
    showSuccess,
    showError,
  ]);

  const handleClear = useCallback(() => {
    setTextImmediate('');
    clearHistory();
    setResult(null);
    setError(null);
    setFileName(null);
    showInfo('Cleared all text');
  }, [setTextImmediate, clearHistory, showInfo]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.humanized);
      showSuccess('Copied to clipboard');
    } catch {
      showError('Failed to copy text');
    }
  }, [result, showSuccess, showError]);

  const handleToneChange = useCallback(
    (value: ToneType) => {
      setTone(value);
      showInfo(`Tone: ${value.charAt(0).toUpperCase() + value.slice(1)}`);
    },
    [showInfo]
  );

  const handleIntensityChange = useCallback(
    (value: IntensityType) => {
      setIntensity(value);
      showInfo(`Intensity: ${value.charAt(0).toUpperCase() + value.slice(1)}`);
    },
    [showInfo]
  );

  const handleStyleChange = useCallback(
    (value: StyleType) => {
      setStyle(value);
      showInfo(`Style: ${value.charAt(0).toUpperCase() + value.slice(1)}`);
    },
    [showInfo]
  );

  // Swipe-down-to-close handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 80) {
      setMobileSidebarOpen(false);
      touchStartY.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchStartY.current = null;
  }, []);

  const getIntensityColor = (value: number) => {
    switch (value) {
      case 1: return '#90CAF9';
      case 2: return '#64B5F6';
      case 3: return '#42A5F5';
      default: return '#90CAF9';
    }
  };

  const getIntensityGlow = (value: number) => {
    switch (value) {
      case 1: return 'rgba(144, 202, 249, 0.3)';
      case 2: return 'rgba(100, 181, 246, 0.35)';
      case 3: return 'rgba(66, 165, 245, 0.4)';
      default: return 'rgba(144, 202, 249, 0.3)';
    }
  };

  const sliderValue = intensity === 'light' ? 1 : intensity === 'medium' ? 2 : 3;

  // Reusable toggle group styles (used on mobile)
  const toggleGroupSx = {
    display: 'flex',
    gap: 0.5,
    width: '100%',
    '& .MuiToggleButtonGroup-grouped': {
      flex: 1,
      border: '1px solid',
      borderRadius: '10px !important',
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(43,47,69,0.1)',
      color: 'text.secondary',
      fontWeight: 600,
      fontSize: '0.75rem',
      textTransform: 'none',
      py: 1,
      px: 0.5,
      minHeight: 40,
      transition: 'all 0.15s ease',
      '&:hover': {
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(91,111,214,0.04)',
        borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(91,111,214,0.2)',
      },
      '&.Mui-selected': {
        backgroundColor: isDark
          ? 'rgba(144,202,249,0.14)'
          : 'rgba(91,111,214,0.1)',
        color: isDark ? '#90caf9' : '#5b6fd6',
        borderColor: isDark ? 'rgba(144,202,249,0.4)' : 'rgba(91,111,214,0.4)',
        '&:hover': {
          backgroundColor: isDark
            ? 'rgba(144,202,249,0.2)'
            : 'rgba(91,111,214,0.16)',
        },
      },
    },
  };

  // ============================================================
  // SIDEBAR CONTENT
  // ============================================================
  const sidebarContent = useMemo(
    () => (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: { xs: 1.75, sm: 2 },
            pt: { xs: 2, sm: 3 },
            borderBottom: `1px solid ${
              isDark ? 'rgba(255,255,255,0.06)' : 'rgba(43,47,69,0.07)'
            }`,
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tune sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, fontSize: '0.9375rem', color: 'text.primary', flex: 1 }}
            >
              Settings
            </Typography>
          </Box>
        </Box>

        {/* Middle scrollable area */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            p: { xs: 1.75, sm: 2 },
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': {
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(43,47,69,0.03)',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(43,47,69,0.12)',
              borderRadius: '3px',
            },
          }}
        >
          {/* Import File */}
          <Box sx={{ mb: 2.5 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<UploadFile />}
              onClick={handleFileUploadClick}
              disabled={loading}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8125rem',
                py: 1.1,
                minHeight: 44,
                borderColor: isDark
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(43,47,69,0.12)',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: isDark
                    ? 'rgba(144,202,249,0.05)'
                    : 'rgba(91,111,214,0.05)',
                },
              }}
            >
              Import File
            </Button>
            {fileName && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.7rem',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fileName}
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleRemoveFileContent}
                  sx={{ p: 0.5 }}
                  aria-label="Remove file"
                >
                  <Close sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            )}
          </Box>

          <Divider
            sx={{
              mb: 2.5,
              borderColor: isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(43,47,69,0.07)',
            }}
          />

          {/* MOBILE: Segmented control layout */}
          {isMobile ? (
            <Stack spacing={2.5}>
              {/* TONE */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'text.secondary',
                    display: 'block',
                    mb: 1,
                  }}
                >
                  Tone
                </Typography>
                <ToggleButtonGroup
                  value={tone}
                  exclusive
                  onChange={(_, value) => value && handleToneChange(value as ToneType)}
                  disabled={loading}
                  sx={toggleGroupSx}
                  aria-label="Tone selection"
                >
                  <ToggleButton value="professional" aria-label="Professional">
                    Prof.
                  </ToggleButton>
                  <ToggleButton value="casual" aria-label="Casual">
                    Casual
                  </ToggleButton>
                  <ToggleButton value="academic" aria-label="Academic">
                    Acad.
                  </ToggleButton>
                  <ToggleButton value="creative" aria-label="Creative">
                    Creative
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* STYLE */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'text.secondary',
                    display: 'block',
                    mb: 1,
                  }}
                >
                  Style
                </Typography>
                <ToggleButtonGroup
                  value={style}
                  exclusive
                  onChange={(_, value) => value && handleStyleChange(value as StyleType)}
                  disabled={loading}
                  sx={toggleGroupSx}
                  aria-label="Style selection"
                >
                  <ToggleButton value="concise" aria-label="Concise">
                    Concise
                  </ToggleButton>
                  <ToggleButton value="balanced" aria-label="Balanced">
                    Balanced
                  </ToggleButton>
                  <ToggleButton value="detailed" aria-label="Detailed">
                    Detailed
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* INTENSITY */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'text.secondary',
                    display: 'block',
                    mb: 1,
                  }}
                >
                  Intensity
                </Typography>
                <ToggleButtonGroup
                  value={intensity}
                  exclusive
                  onChange={(_, value) =>
                    value && handleIntensityChange(value as IntensityType)
                  }
                  disabled={loading}
                  sx={toggleGroupSx}
                  aria-label="Intensity selection"
                >
                  <ToggleButton value="light" aria-label="Light">
                    Light
                  </ToggleButton>
                  <ToggleButton value="medium" aria-label="Medium">
                    Medium
                  </ToggleButton>
                  <ToggleButton value="heavy" aria-label="Heavy">
                    Heavy
                  </ToggleButton>
                </ToggleButtonGroup>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.75,
                    fontSize: '0.65rem',
                    color: 'text.secondary',
                    textAlign: 'center',
                  }}
                >
                  {intensity === 'light'
                    ? '55% of words changed'
                    : intensity === 'medium'
                    ? '75% of words changed'
                    : '90% of words changed'}
                </Typography>
              </Box>
            </Stack>
          ) : (
            /* DESKTOP: detailed collapsible cards */
            <>
              {/* TONE */}
              <Box sx={{ mb: 2 }}>
                <Box
                  onClick={() => setToneOpen(!toneOpen)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    py: 1,
                    px: 1,
                    borderRadius: 1.5,
                    minHeight: 40,
                    '&:hover': {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(91,111,214,0.05)',
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'text.secondary',
                    }}
                  >
                    Tone
                  </Typography>
                  <IconButton size="small" sx={{ p: 0.25 }} aria-label="Toggle tone">
                    {toneOpen ? (
                      <ExpandLess sx={{ fontSize: 18 }} />
                    ) : (
                      <ExpandMore sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </Box>

                <Collapse in={toneOpen} timeout={200} unmountOnExit>
                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    {[
                      { value: 'professional', label: 'Professional', desc: 'Formal business' },
                      { value: 'casual', label: 'Casual', desc: 'Relaxed & friendly' },
                      { value: 'academic', label: 'Academic', desc: 'Scholarly & formal' },
                      { value: 'creative', label: 'Creative', desc: 'Expressive & vivid' },
                    ].map((option) => (
                      <Paper
                        key={option.value}
                        elevation={0}
                        onClick={() =>
                          !loading && handleToneChange(option.value as ToneType)
                        }
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          cursor: loading ? 'not-allowed' : 'pointer',
                          minHeight: 44,
                          backgroundColor:
                            tone === option.value
                              ? isDark
                                ? 'rgba(144, 202, 249, 0.1)'
                                : 'rgba(91, 111, 214, 0.07)'
                              : 'transparent',
                          border: '1px solid',
                          borderColor:
                            tone === option.value
                              ? isDark
                                ? 'rgba(144, 202, 249, 0.3)'
                                : 'rgba(91, 111, 214, 0.22)'
                              : 'transparent',
                          '&:hover': {
                            backgroundColor:
                              tone === option.value
                                ? isDark
                                  ? 'rgba(144, 202, 249, 0.15)'
                                  : 'rgba(91, 111, 214, 0.11)'
                                : isDark
                                ? 'rgba(255,255,255,0.03)'
                                : 'rgba(91,111,214,0.04)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor:
                                tone === option.value ? 'primary.main' : 'transparent',
                              border: '2px solid',
                              borderColor:
                                tone === option.value
                                  ? 'primary.main'
                                  : isDark
                                  ? 'rgba(255,255,255,0.2)'
                                  : 'rgba(43,47,69,0.2)',
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: '0.8125rem',
                                fontWeight: tone === option.value ? 600 : 500,
                                color:
                                  tone === option.value
                                    ? 'primary.main'
                                    : 'text.primary',
                              }}
                            >
                              {option.label}
                            </Typography>
                            <Typography
                              sx={{ fontSize: '0.65rem', color: 'text.secondary' }}
                            >
                              {option.desc}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                </Collapse>
              </Box>

              <Divider
                sx={{
                  mb: 2,
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(43,47,69,0.07)',
                }}
              />

              {/* STYLE */}
              <Box sx={{ mb: 2 }}>
                <Box
                  onClick={() => setStyleOpen(!styleOpen)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    py: 1,
                    px: 1,
                    borderRadius: 1.5,
                    minHeight: 40,
                    '&:hover': {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(91,111,214,0.05)',
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'text.secondary',
                    }}
                  >
                    Style
                  </Typography>
                  <IconButton size="small" sx={{ p: 0.25 }} aria-label="Toggle style">
                    {styleOpen ? (
                      <ExpandLess sx={{ fontSize: 18 }} />
                    ) : (
                      <ExpandMore sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </Box>

                <Collapse in={styleOpen} timeout={200} unmountOnExit>
                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    {[
                      { value: 'concise', label: 'Concise', desc: 'Short & direct' },
                      { value: 'balanced', label: 'Balanced', desc: 'Well-structured' },
                      { value: 'detailed', label: 'Detailed', desc: 'In-depth' },
                    ].map((option) => (
                      <Paper
                        key={option.value}
                        elevation={0}
                        onClick={() =>
                          !loading && handleStyleChange(option.value as StyleType)
                        }
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          cursor: loading ? 'not-allowed' : 'pointer',
                          minHeight: 44,
                          backgroundColor:
                            style === option.value
                              ? isDark
                                ? 'rgba(144, 202, 249, 0.1)'
                                : 'rgba(91, 111, 214, 0.07)'
                              : 'transparent',
                          border: '1px solid',
                          borderColor:
                            style === option.value
                              ? isDark
                                ? 'rgba(144, 202, 249, 0.3)'
                                : 'rgba(91, 111, 214, 0.22)'
                              : 'transparent',
                          '&:hover': {
                            backgroundColor:
                              style === option.value
                                ? isDark
                                  ? 'rgba(144, 202, 249, 0.15)'
                                  : 'rgba(91, 111, 214, 0.11)'
                                : isDark
                                ? 'rgba(255,255,255,0.03)'
                                : 'rgba(91,111,214,0.04)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor:
                                style === option.value ? 'primary.main' : 'transparent',
                              border: '2px solid',
                              borderColor:
                                style === option.value
                                  ? 'primary.main'
                                  : isDark
                                  ? 'rgba(255,255,255,0.2)'
                                  : 'rgba(43,47,69,0.2)',
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: '0.8125rem',
                                fontWeight: style === option.value ? 600 : 500,
                                color:
                                  style === option.value
                                    ? 'primary.main'
                                    : 'text.primary',
                              }}
                            >
                              {option.label}
                            </Typography>
                            <Typography
                              sx={{ fontSize: '0.65rem', color: 'text.secondary' }}
                            >
                              {option.desc}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                </Collapse>
              </Box>

              <Divider
                sx={{
                  mb: 2,
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(43,47,69,0.07)',
                }}
              />

              {/* INTENSITY */}
              <Box sx={{ mb: 2 }}>
                <Box
                  onClick={() => setIntensityOpen(!intensityOpen)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    py: 1,
                    px: 1,
                    borderRadius: 1.5,
                    minHeight: 40,
                    '&:hover': {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(91,111,214,0.05)',
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'text.secondary',
                    }}
                  >
                    Intensity
                  </Typography>
                  <IconButton size="small" sx={{ p: 0.25 }} aria-label="Toggle intensity">
                    {intensityOpen ? (
                      <ExpandLess sx={{ fontSize: 18 }} />
                    ) : (
                      <ExpandMore sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </Box>

                <Collapse in={intensityOpen} timeout={200} unmountOnExit>
                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    {[
                      { value: 'light', label: 'Light', desc: '55% changes', color: '#7dafff' },
                      { value: 'medium', label: 'Medium', desc: '75% changes', color: '#5b9ee8' },
                      { value: 'heavy', label: 'Heavy', desc: '90% changes', color: '#3d84d1' },
                    ].map((option) => (
                      <Paper
                        key={option.value}
                        elevation={0}
                        onClick={() =>
                          !loading && handleIntensityChange(option.value as IntensityType)
                        }
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          cursor: loading ? 'not-allowed' : 'pointer',
                          minHeight: 44,
                          backgroundColor:
                            intensity === option.value
                              ? isDark
                                ? `${option.color}15`
                                : `${option.color}12`
                              : 'transparent',
                          border: '1px solid',
                          borderColor:
                            intensity === option.value
                              ? `${option.color}60`
                              : 'transparent',
                          '&:hover': {
                            backgroundColor:
                              intensity === option.value
                                ? `${option.color}20`
                                : isDark
                                ? 'rgba(255,255,255,0.03)'
                                : 'rgba(91,111,214,0.04)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor:
                                intensity === option.value ? option.color : 'transparent',
                              border: '2px solid',
                              borderColor:
                                intensity === option.value
                                  ? option.color
                                  : isDark
                                  ? 'rgba(255,255,255,0.2)'
                                  : 'rgba(43,47,69,0.2)',
                              boxShadow:
                                intensity === option.value
                                  ? `0 0 8px ${option.color}60`
                                  : 'none',
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: '0.8125rem',
                                fontWeight: intensity === option.value ? 600 : 500,
                                color:
                                  intensity === option.value
                                    ? option.color
                                    : 'text.primary',
                              }}
                            >
                              {option.label}
                            </Typography>
                            <Typography
                              sx={{ fontSize: '0.65rem', color: 'text.secondary' }}
                            >
                              {option.desc}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>

                  <Box sx={{ mt: 2, px: 1, pb: 1 }}>
                    <Slider
                      value={sliderValue}
                      onChange={(_, value) => {
                        const levels: IntensityType[] = ['light', 'medium', 'heavy'];
                        handleIntensityChange(levels[(value as number) - 1]);
                      }}
                      min={1}
                      max={3}
                      step={1}
                      disabled={loading}
                      sx={{
                        '& .MuiSlider-track': {
                          background:
                            'linear-gradient(90deg, #BBDEFB 0%, #90CAF9 50%, #64B5F6 100%)',
                          borderRadius: 3,
                          height: 4,
                          border: 'none',
                        },
                        '& .MuiSlider-rail': {
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(43,47,69,0.12)',
                          height: 4,
                          borderRadius: 3,
                        },
                        '& .MuiSlider-thumb': {
                          width: 16,
                          height: 16,
                          backgroundColor: getIntensityColor(sliderValue),
                          boxShadow: `0 2px 8px ${getIntensityGlow(sliderValue)}`,
                        },
                      }}
                      marks={[
                        { value: 1, label: 'L' },
                        { value: 2, label: 'M' },
                        { value: 3, label: 'H' },
                      ]}
                    />
                  </Box>
                </Collapse>
              </Box>
            </>
          )}
        </Box>

        {/* Footer — always visible */}
        <Box
          sx={{
            p: { xs: 1.75, sm: 2 },
            borderTop: `1px solid ${
              isDark ? 'rgba(255,255,255,0.06)' : 'rgba(43,47,69,0.07)'
            }`,
            backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
            flexShrink: 0,
            pb: { xs: 'calc(14px + env(safe-area-inset-bottom))', sm: 2 },
          }}
        >
          <Stack spacing={1.25}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleHumanize}
              disabled={loading || !text.trim()}
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <AutoAwesome sx={{ fontSize: 20 }} />
                )
              }
              sx={{
                borderRadius: 2.5,
                py: 1.6,
                fontWeight: 700,
                fontSize: '0.9375rem',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                boxShadow: 'none',
                minHeight: 48,
                '&:hover': { boxShadow: 'none' },
                '&:disabled': {
                  background: isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(43,47,69,0.08)',
                },
              }}
            >
              {loading ? 'Humanizing...' : 'Humanize'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleClear}
              disabled={loading || !text}
              startIcon={<Clear sx={{ fontSize: 18 }} />}
              sx={{
                borderRadius: 2.5,
                py: 1.25,
                fontWeight: 600,
                fontSize: '0.8125rem',
                textTransform: 'none',
                minHeight: 44,
                borderColor: isDark
                  ? 'rgba(255,255,255,0.15)'
                  : 'rgba(43,47,69,0.15)',
                color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(43,47,69,0.75)',
                '&:hover': {
                  borderColor: '#e05a5a',
                  color: '#e05a5a',
                  backgroundColor: 'rgba(224, 90, 90, 0.06)',
                },
              }}
            >
              Clear All
            </Button>
          </Stack>
        </Box>
      </Box>
    ),
    [
      isMobile,
      isDark,
      tone,
      style,
      intensity,
      loading,
      fileName,
      toneOpen,
      styleOpen,
      intensityOpen,
      sliderValue,
      text,
      handleFileUploadClick,
      handleRemoveFileContent,
      handleHumanize,
      handleClear,
      handleToneChange,
      handleStyleChange,
      handleIntensityChange,
    ]
  );

  // ============ MAIN RENDER ============
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        width: '100%',
        gap: { xs: 0, md: 3 },
      }}
    >
      {/* SIDEBAR - Desktop */}
      {!isMobile && (
        <Box
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            position: 'sticky',
            top: 80,
            alignSelf: 'flex-start',
            height: 'calc(100vh - 96px)',
            borderRadius: 3,
            border: `1px solid ${
              isDark ? 'rgba(255,255,255,0.06)' : 'rgba(43,47,69,0.07)'
            }`,
            overflow: 'hidden',
          }}
        >
          {sidebarContent}
        </Box>
      )}

      {/* SIDEBAR - Mobile Drawer (bottom sheet) */}
      {isMobile && (
        <Drawer
          anchor="bottom"
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          PaperProps={{
            sx: {
              backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
              // Match app navbar height (64px) so close button is never clipped
              height: 'calc(100vh - 64px)',
              maxHeight: 'calc(100vh - 64px)',
              borderRadius: '20px 20px 0 0',
              overflow: 'hidden',
            },
          }}
          ModalProps={{ keepMounted: false }}
        >
          {/* Drag handle + floating close button — always visible */}
          <Box
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            sx={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              pt: 1.25,
              pb: 0.5,
              flexShrink: 0,
              touchAction: 'none',
              cursor: 'grab',
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.2)'
                  : 'rgba(43,47,69,0.2)',
              }}
            />
            <IconButton
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close settings"
              sx={{
                position: 'absolute',
                top: 4,
                right: 8,
                width: 40,
                height: 40,
                borderRadius: 2,
                color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(43,47,69,0.75)',
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(43,47,69,0.06)',
                '&:hover': {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(43,47,69,0.12)',
                  color: isDark ? '#ffffff' : '#2b2f45',
                },
                zIndex: 2,
              }}
            >
              <Close sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
          {sidebarContent}
        </Drawer>
      )}

      {/* MAIN CONTENT */}
      <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
        {/* Main Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            mb: { xs: 2, sm: 3 },
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.15rem', sm: '1.35rem', md: '1.5rem' },
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 0.5,
                lineHeight: 1.25,
              }}
            >
              AI Text Humanizer
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
            >
              Transform AI-generated content into natural writing
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
            {isMobile && (
              <Button
                variant="outlined"
                startIcon={<Tune />}
                onClick={() => setMobileSidebarOpen(true)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  py: 0.75,
                  px: 1.5,
                  minHeight: 40,
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(43,47,69,0.15)',
                }}
              >
                Settings
              </Button>
            )}
            <Tooltip title="Undo (Ctrl+Z)">
              <span>
                <IconButton
                  onClick={handleUndo}
                  disabled={!canUndo || loading}
                  size="small"
                  sx={{
                    borderRadius: 1.5,
                    width: 40,
                    height: 40,
                    backgroundColor: canUndo
                      ? alpha(theme.palette.primary.main, 0.08)
                      : 'transparent',
                  }}
                  aria-label="Undo"
                >
                  <Undo fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Y)">
              <span>
                <IconButton
                  onClick={handleRedo}
                  disabled={!canRedo || loading}
                  size="small"
                  sx={{
                    borderRadius: 1.5,
                    width: 40,
                    height: 40,
                    backgroundColor: canRedo
                      ? alpha(theme.palette.primary.main, 0.08)
                      : 'transparent',
                  }}
                  aria-label="Redo"
                >
                  <Redo fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <TextField
          fullWidth
          multiline
          minRows={isSmall ? 8 : 10}
          maxRows={20}
          variant="outlined"
          placeholder="Paste your AI-generated text here..."
          value={text}
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y')) {
              e.preventDefault();
            }
          }}
          disabled={loading}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
              lineHeight: 1.7,
              color: 'text.primary',
              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
              borderRadius: 2,
              '& fieldset': {
                borderColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(43,47,69,0.1)',
              },
              '&:hover fieldset': {
                borderColor: isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(43,47,69,0.2)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
                borderWidth: 2,
              },
              '& textarea': {
                padding: { xs: '14px 16px', sm: '16px 20px' },
              },
            },
          }}
        />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 2,
            px: 0.5,
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' } }}
          >
            {text
              ? `${text.split(/\s+/).filter((w) => w).length} words - ${
                  text.length
                } characters`
              : 'No text entered'}
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 2, fontSize: '0.8125rem' }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {result && (
          <Box ref={resultRef} sx={{ mt: 2, scrollMarginTop: '80px' }}>
            <ResultDisplay result={result} onCopy={handleCopy} />
          </Box>
        )}
      </Box>

      {showFileUpload && (
        <FileUpload
          onFileContent={handleFileContent}
          onClose={() => setShowFileUpload(false)}
        />
      )}
    </Box>
  );
};

export default Editor;