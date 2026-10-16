// src/components/Editor.tsx

import React, { useState, useEffect, useRef } from 'react';
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
  Chip,
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
  const [tone, setTone] = useState<ToneType>('professional');
  const [style, setStyle] = useState<StyleType>('balanced');
  const [intensity, setIntensity] = useState<IntensityType>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HumanizeResponse | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Collapsible section states
  const [toneOpen, setToneOpen] = useState(true);
  const [styleOpen, setStyleOpen] = useState(true);
  const [intensityOpen, setIntensityOpen] = useState(true);

  // Refs for scroll control
  const resultRef = useRef<HTMLDivElement>(null);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        const previousText = undo();
        if (previousText !== undefined) showInfo('Undo ✅');
        return;
      }

      if (isCtrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        e.stopPropagation();
        const nextText = redo();
        if (nextText !== undefined) showInfo('Redo 🔄');
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [undo, redo, showInfo]);

  const handleUndo = () => {
    const previousText = undo();
    if (previousText !== undefined) showInfo('Undo ✅');
  };

  const handleRedo = () => {
    const nextText = redo();
    if (nextText !== undefined) showInfo('Redo 🔄');
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleFileContent = (content: string, name: string) => {
    const separator = text ? '\n\n' : '';
    const newText = text + separator + content;
    setTextImmediate(newText);
    setFileName(name);
    setShowFileUpload(false);
    showInfo(`File "${name}" loaded successfully! 📄`);
  };

  const handleFileUploadClick = () => setShowFileUpload(!showFileUpload);

  const handleRemoveFileContent = () => {
    const lines = text.split('\n');
    let fileContentStart = -1;
    let fileContentEnd = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(`=== ${fileName}`)) fileContentStart = i;
      if (fileContentStart !== -1 && lines[i].startsWith('===') && i > fileContentStart) {
        fileContentEnd = i;
        break;
      }
    }

    if (fileContentStart !== -1 && fileContentEnd !== -1) {
      const beforeContent = lines.slice(0, fileContentStart).join('\n');
      const afterContent = lines.slice(fileContentEnd + 1).join('\n');
      const newText = [beforeContent, afterContent].filter(s => s.trim()).join('\n\n');
      setTextImmediate(newText);
      setFileName(null);
      showInfo('File content removed');
    }
  };

  const handleHumanize = async () => {
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
      showSuccess('Text humanized successfully! 🎉');

      // Smoothly scroll to result WITHOUT jumping to top
      setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 300);
    } catch (err) {
      dismissToast(toastId);
      setError('Failed to humanize text. Please try again.');
      showError('Failed to humanize text. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTextImmediate('');
    clearHistory();
    setResult(null);
    setError(null);
    setFileName(null);
    showInfo('Cleared all text 🗑️');
  };

  const handleCopy = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result.humanized);
        showSuccess('Copied to clipboard! 📋');
      } catch (err) {
        showError('Failed to copy text');
      }
    }
  };

  const handleToneChange = (value: ToneType) => {
    setTone(value);
    showInfo(`Tone changed to: ${value.charAt(0).toUpperCase() + value.slice(1)}`);
  };

  const handleIntensityChange = (value: IntensityType) => {
    setIntensity(value);
    showInfo(`Intensity changed to: ${value.charAt(0).toUpperCase() + value.slice(1)}`);
  };

  const handleStyleChange = (value: StyleType) => {
    setStyle(value);
    showInfo(`Style changed to: ${value.charAt(0).toUpperCase() + value.slice(1)}`);
  };

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
  const gradientStart = '#BBDEFB';
  const gradientMid = '#90CAF9';
  const gradientEnd = '#64B5F6';

  // ============ SIDEBAR CONTENT ============
  const SidebarContent = () => (
    <Box
      sx={{
        width: isMobile ? '100%' : SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
      }}
    >
      {/* Fixed Header of Sidebar */}
      <Box
        sx={{
          p: 2,
          pt: 3,
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tune sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              fontSize: '0.9375rem',
              color: 'text.primary',
              flex: 1,
            }}
          >
            Settings
          </Typography>
          {isMobile && (
            <IconButton
              size="small"
              onClick={() => setMobileSidebarOpen(false)}
              sx={{ p: 0.5 }}
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Scrollable Content Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': {
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
            borderRadius: '3px',
            '&:hover': {
              background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            },
          },
        }}
      >
        {/* File Upload */}
        <Box sx={{ mb: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<UploadFile />}
            onClick={handleFileUploadClick}
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.8125rem',
              py: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: isDark ? 'rgba(144,202,249,0.05)' : 'rgba(102,126,234,0.05)',
              },
            }}
          >
            Import File
          </Button>
          {fileName && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', flex: 1 }}>
                📄 {fileName}
              </Typography>
              <IconButton size="small" onClick={handleRemoveFileContent} sx={{ p: 0.25 }}>
                <Close sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 2, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

        {/* ============ TONE SECTION - COLLAPSIBLE ============ */}
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
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
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
              🎭 Tone
            </Typography>
            <IconButton size="small" sx={{ p: 0.25 }}>
              {toneOpen ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
            </IconButton>
          </Box>

          <Collapse in={toneOpen} timeout={300}>
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
                  onClick={() => !loading && handleToneChange(option.value as ToneType)}
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    backgroundColor: tone === option.value
                      ? isDark ? 'rgba(144, 202, 249, 0.1)' : 'rgba(102, 126, 234, 0.08)'
                      : 'transparent',
                    border: '1px solid',
                    borderColor: tone === option.value
                      ? isDark ? 'rgba(144, 202, 249, 0.3)' : 'rgba(102, 126, 234, 0.25)'
                      : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: tone === option.value
                        ? isDark ? 'rgba(144, 202, 249, 0.15)' : 'rgba(102, 126, 234, 0.12)'
                        : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: tone === option.value ? 'primary.main' : 'transparent',
                        border: '2px solid',
                        borderColor: tone === option.value ? 'primary.main' : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{
                        fontSize: '0.8125rem',
                        fontWeight: tone === option.value ? 600 : 500,
                        color: tone === option.value ? 'primary.main' : 'text.primary',
                      }}>
                        {option.label}
                      </Typography>
                      <Typography sx={{
                        fontSize: '0.65rem',
                        color: 'text.secondary',
                        opacity: 0.8,
                      }}>
                        {option.desc}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Collapse>
        </Box>

        <Divider sx={{ mb: 2, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

        {/* ============ STYLE SECTION - COLLAPSIBLE ============ */}
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
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
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
              ✍️ Style
            </Typography>
            <IconButton size="small" sx={{ p: 0.25 }}>
              {styleOpen ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
            </IconButton>
          </Box>

          <Collapse in={styleOpen} timeout={300}>
            <Stack spacing={0.75} sx={{ mt: 1 }}>
              {[
                { value: 'concise', label: 'Concise', desc: 'Short & direct' },
                { value: 'balanced', label: 'Balanced', desc: 'Well-structured' },
                { value: 'detailed', label: 'Detailed', desc: 'In-depth' },
              ].map((option) => (
                <Paper
                  key={option.value}
                  elevation={0}
                  onClick={() => !loading && handleStyleChange(option.value as StyleType)}
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    backgroundColor: style === option.value
                      ? isDark ? 'rgba(144, 202, 249, 0.1)' : 'rgba(102, 126, 234, 0.08)'
                      : 'transparent',
                    border: '1px solid',
                    borderColor: style === option.value
                      ? isDark ? 'rgba(144, 202, 249, 0.3)' : 'rgba(102, 126, 234, 0.25)'
                      : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: style === option.value
                        ? isDark ? 'rgba(144, 202, 249, 0.15)' : 'rgba(102, 126, 234, 0.12)'
                        : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: style === option.value ? 'primary.main' : 'transparent',
                        border: '2px solid',
                        borderColor: style === option.value ? 'primary.main' : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{
                        fontSize: '0.8125rem',
                        fontWeight: style === option.value ? 600 : 500,
                        color: style === option.value ? 'primary.main' : 'text.primary',
                      }}>
                        {option.label}
                      </Typography>
                      <Typography sx={{
                        fontSize: '0.65rem',
                        color: 'text.secondary',
                        opacity: 0.8,
                      }}>
                        {option.desc}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Collapse>
        </Box>

        <Divider sx={{ mb: 2, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

        {/* ============ INTENSITY SECTION - COLLAPSIBLE ============ */}
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
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
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
              ⚡ Intensity
            </Typography>
            <IconButton size="small" sx={{ p: 0.25 }}>
              {intensityOpen ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
            </IconButton>
          </Box>

          <Collapse in={intensityOpen} timeout={300}>
            <Stack spacing={0.75} sx={{ mt: 1 }}>
              {[
                { value: 'light', label: 'Light', desc: '55% changes', color: '#90CAF9' },
                { value: 'medium', label: 'Medium', desc: '75% changes', color: '#64B5F6' },
                { value: 'heavy', label: 'Heavy', desc: '90% changes', color: '#42A5F5' },
              ].map((option) => (
                <Paper
                  key={option.value}
                  elevation={0}
                  onClick={() => !loading && handleIntensityChange(option.value as IntensityType)}
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    backgroundColor: intensity === option.value
                      ? isDark ? `${option.color}15` : `${option.color}10`
                      : 'transparent',
                    border: '1px solid',
                    borderColor: intensity === option.value
                      ? `${option.color}60`
                      : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: intensity === option.value
                        ? `${option.color}20`
                        : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: intensity === option.value ? option.color : 'transparent',
                        border: '2px solid',
                        borderColor: intensity === option.value ? option.color : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                        boxShadow: intensity === option.value ? `0 0 8px ${option.color}60` : 'none',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{
                        fontSize: '0.8125rem',
                        fontWeight: intensity === option.value ? 600 : 500,
                        color: intensity === option.value ? option.color : 'text.primary',
                      }}>
                        {option.label}
                      </Typography>
                      <Typography sx={{
                        fontSize: '0.65rem',
                        color: 'text.secondary',
                        opacity: 0.8,
                      }}>
                        {option.desc}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Stack>

            {/* Intensity Slider */}
            <Box sx={{ mt: 2, px: 1 }}>
              <Slider
                value={sliderValue}
                onChange={(_, value) => {
                  const levels: IntensityType[] = ['light', 'medium', 'heavy'];
                  handleIntensityChange(levels[value as number - 1]);
                }}
                min={1}
                max={3}
                step={1}
                disabled={loading}
                sx={{
                  '& .MuiSlider-track': {
                    background: `linear-gradient(90deg, ${gradientStart} 0%, ${gradientMid} 50%, ${gradientEnd} 100%)`,
                    borderRadius: 3,
                    height: 4,
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    height: 4,
                    borderRadius: 3,
                  },
                  '& .MuiSlider-thumb': {
                    width: 14,
                    height: 14,
                    backgroundColor: getIntensityColor(sliderValue),
                    boxShadow: `0 2px 8px ${getIntensityGlow(sliderValue)}`,
                    '&:hover': {
                      boxShadow: `0 2px 12px ${getIntensityGlow(sliderValue)}`,
                    },
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
      </Box>

      {/* Fixed Footer with Action Buttons */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
          flexShrink: 0,
        }}
      >
        <Stack spacing={1.5}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleHumanize}
            disabled={loading || !text.trim()}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome sx={{ fontSize: 20 }} />}
            sx={{
              borderRadius: 2.5,
              py: 1.5,
              fontWeight: 700,
              fontSize: '0.875rem',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              boxShadow: '0 4px 24px rgba(102, 126, 234, 0.35)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                boxShadow: '0 8px 40px rgba(102, 126, 234, 0.5)',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
              '&:disabled': {
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                boxShadow: 'none',
                transform: 'none',
              },
            }}
          >
            {loading ? 'Humanizing...' : '✨ Humanize'}
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
              borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
              color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#ef4444',
                color: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Clear All
          </Button>
        </Stack>
      </Box>
    </Box>
  );

  // ============ MAIN RENDER ============
  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 64px)', // Subtract navbar height
        mt: '64px', // Push below fixed navbar
        overflow: 'hidden',
      }}
    >
      {/* SIDEBAR - Desktop */}
      {!isMobile && (
        <Box
          sx={{
            width: SIDEBAR_WIDTH,
            height: '100%',
            flexShrink: 0,
            borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          }}
        >
          <SidebarContent />
        </Box>
      )}

      {/* SIDEBAR - Mobile Drawer */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          PaperProps={{
            sx: {
              width: SIDEBAR_WIDTH,
              backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
              mt: '64px', // Push below navbar
              height: 'calc(100vh - 64px)',
            },
          }}
        >
          <SidebarContent />
        </Drawer>
      )}

      {/* MAIN CONTENT */}
      <Box
        sx={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          p: { xs: 2, sm: 3, md: 4 },
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': {
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
            borderRadius: '4px',
            '&:hover': {
              background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            },
          },
        }}
      >
        {/* Main Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 0.5,
              }}
            >
              AI Text Humanizer
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
              Transform AI-generated content into natural writing
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {isMobile && (
              <Button
                variant="outlined"
                startIcon={<Tune />}
                onClick={() => setMobileSidebarOpen(true)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
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
                    backgroundColor: canUndo ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    '&:hover': {
                      backgroundColor: canUndo ? alpha(theme.palette.primary.main, 0.16) : 'transparent',
                    },
                  }}
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
                    backgroundColor: canRedo ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    '&:hover': {
                      backgroundColor: canRedo ? alpha(theme.palette.primary.main, 0.16) : 'transparent',
                    },
                  }}
                >
                  <Redo fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* File Upload Section */}
        <Collapse in={showFileUpload}>
          <Box sx={{ mb: 3 }}>
            <FileUpload onFileContent={handleFileContent} />
            <Divider sx={{ mt: 2, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
          </Box>
        </Collapse>

        {/* Text Input */}
        <TextField
          fullWidth
          multiline
          minRows={10}
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
              fontSize: '0.9375rem',
              lineHeight: 1.7,
              color: 'text.primary',
              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '& fieldset': {
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              },
              '&:hover fieldset': {
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
                borderWidth: 2,
              },
              '& textarea': {
                padding: '16px 20px',
              },
            },
          }}
        />

        {/* Word Count */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, px: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {text ? `${text.split(/\s+/).filter(w => w).length} words • ${text.length} characters` : 'No text entered'}
          </Typography>
          {(canUndo || canRedo) && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              History: {canUndo ? '↩️' : ''} {canRedo ? '↪️' : ''}
            </Typography>
          )}
        </Box>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Result Display - with ref for smooth scroll */}
        {result && (
          <Box ref={resultRef} sx={{ mt: 2, scrollMarginTop: '80px' }}>
            <ResultDisplay result={result} onCopy={handleCopy} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Editor;