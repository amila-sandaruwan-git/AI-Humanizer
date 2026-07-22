import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
} from '@mui/material';
import {
  Undo,
  Redo,
  Clear,
  UploadFile,
  Close,
  AutoAwesome,
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

const Editor: React.FC<EditorProps> = ({ onHumanize }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [tone, setTone] = useState<ToneType>('professional');
  const [style, setStyle] = useState<StyleType>('balanced');
  const [intensity, setIntensity] = useState<IntensityType>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HumanizeResponse | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  
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
        e.stopPropagation();
        const previousText = undo();
        if (previousText !== undefined) {
          showInfo('Undo ✅');
        }
        return;
      }
      
      if (isCtrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        e.stopPropagation();
        const nextText = redo();
        if (nextText !== undefined) {
          showInfo('Redo 🔄');
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [undo, redo, showInfo]);

  const handleUndo = () => {
    const previousText = undo();
    if (previousText !== undefined) {
      showInfo('Undo ✅');
    }
    return previousText;
  };

  const handleRedo = () => {
    const nextText = redo();
    if (nextText !== undefined) {
      showInfo('Redo 🔄');
    }
    return nextText;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);
  };

  const handleFileContent = (content: string, name: string) => {
    const separator = text ? '\n\n' : '';
    const newText = text + separator + content;
    setTextImmediate(newText);
    setFileName(name);
    setShowFileUpload(false);
    showInfo(`File "${name}" loaded successfully! 📄`);
  };

  const handleFileUploadClick = () => {
    setShowFileUpload(!showFileUpload);
  };

  const handleRemoveFileContent = () => {
    const lines = text.split('\n');
    let fileContentStart = -1;
    let fileContentEnd = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(`=== ${fileName}`)) {
        fileContentStart = i;
      }
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
      const response = await humanizeText({
        text,
        tone,
        style,
        intensity,
      });
      
      setResult(response);
      onHumanize(response);
      
      dismissToast(toastId);
      showSuccess('Text humanized successfully! 🎉');
      
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

  // Get intensity color based on value
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

  // Rich dropdown options without icons
  const toneOptions = [
    { value: 'professional', label: 'Professional', description: 'Formal business language' },
    { value: 'casual', label: 'Casual', description: 'Relaxed conversational tone' },
    { value: 'academic', label: 'Academic', description: 'Scholarly and formal' },
    { value: 'creative', label: 'Creative', description: 'Descriptive and expressive' },
  ];

  const styleOptions = [
    { value: 'concise', label: 'Concise', description: 'Short and direct' },
    { value: 'balanced', label: 'Balanced', description: 'Well-structured' },
    { value: 'detailed', label: 'Detailed', description: 'In-depth and thorough' },
  ];

  const intensityOptions = [
    { value: 'light', label: 'Light', description: '55% word replacement' },
    { value: 'medium', label: 'Medium', description: '75% word replacement' },
    { value: 'heavy', label: 'Heavy', description: '98% word replacement' },
  ];

  // Get active option color
  const getActiveColor = (value: string, options: any[]) => {
    const option = options.find(o => o.value === value);
    return option ? option.color : '#667eea';
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
          },
        }}
      >
        {/* Header Section */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
                fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              AI Text Humanizer
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                fontSize: '0.9375rem',
                fontWeight: 400,
                letterSpacing: '-0.01em',
                mt: 0.25,
              }}
            >
              Transform AI-generated content into natural, human-like writing
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 0.75, 
            flexWrap: 'wrap',
            alignSelf: { xs: 'flex-start', sm: 'center' },
          }}>
            <Tooltip title="Import File">
              <IconButton 
                onClick={handleFileUploadClick}
                disabled={loading}
                sx={{
                  borderRadius: '12px',
                  p: 1.5,
                  backgroundColor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <UploadFile />
              </IconButton>
            </Tooltip>
            <Tooltip title={`Undo (Ctrl+Z)${!canUndo ? ' - No actions to undo' : ''}`}>
              <span>
                <IconButton 
                  onClick={handleUndo} 
                  disabled={!canUndo || loading}
                  sx={{
                    borderRadius: '12px',
                    p: 1.5,
                    border: '1px solid',
                    borderColor: canUndo ? 'primary.main' : 'divider',
                    backgroundColor: canUndo ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: canUndo ? alpha(theme.palette.primary.main, 0.16) : 'transparent',
                    },
                  }}
                >
                  <Undo />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={`Redo (Ctrl+Y)${!canRedo ? ' - No actions to redo' : ''}`}>
              <span>
                <IconButton 
                  onClick={handleRedo} 
                  disabled={!canRedo || loading}
                  sx={{
                    borderRadius: '12px',
                    p: 1.5,
                    border: '1px solid',
                    borderColor: canRedo ? 'primary.main' : 'divider',
                    backgroundColor: canRedo ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: canRedo ? alpha(theme.palette.primary.main, 0.16) : 'transparent',
                    },
                  }}
                >
                  <Redo />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Clear text">
              <span>
                <IconButton 
                  onClick={handleClear} 
                  disabled={!text || loading}
                  sx={{
                    borderRadius: '12px',
                    p: 1.5,
                    border: '1px solid',
                    borderColor: text ? 'error.main' : 'divider',
                    backgroundColor: text ? alpha(theme.palette.error.main, 0.08) : 'transparent',
                    color: text ? 'error.main' : 'inherit',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: text ? alpha(theme.palette.error.main, 0.16) : 'transparent',
                    },
                  }}
                >
                  <Clear />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* File Upload Section */}
        <Collapse in={showFileUpload}>
          <Box sx={{ mb: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <FileUpload onFileContent={handleFileContent} />
            {fileName && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Loaded: {fileName}
                </Typography>
                <IconButton size="small" onClick={handleRemoveFileContent}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            )}
            <Divider sx={{ mt: 2 }} />
          </Box>
        </Collapse>

        {/* Input Area */}
        <TextField
          fullWidth
          multiline
          rows={10}
          variant="outlined"
          placeholder="Paste your AI-generated text here or upload a file..."
          value={text}
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y')) {
              e.preventDefault();
            }
          }}
          disabled={loading}
          sx={{ 
            mb: 2.5,
            '& .MuiOutlinedInput-root': {
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              fontSize: '1rem',
              lineHeight: 1.8,
              color: isDark ? '#e8e8f0' : '#1a1a2e',
              backgroundColor: isDark ? alpha(theme.palette.background.paper, 0.6) : 'background.paper',
              borderRadius: 3,
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'divider',
              transition: 'all 0.25s ease',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              },
              '&.Mui-focused': {
                borderColor: 'primary.main',
                boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}`,
              },
              '& textarea': {
                padding: '20px 24px',
                color: isDark ? '#e8e8f0' : '#1a1a2e',
              },
            },
          }}
        />

        {/* Status Bar */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          px: 1,
          py: 0.5,
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary" sx={{ 
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 400,
              letterSpacing: '-0.01em',
            }}>
              {text ? `${text.split(/\s+/).filter(w => w).length} words • ${text.length} characters` : 'No text entered'}
            </Typography>
          </Box>
        </Box>

        {/* ========== RICH DROPDOWN SECTIONS - WITHOUT ICONS ========== */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} sx={{ mb: 3.5 }}>
          {/* Tone Dropdown - Rich Design */}
          <FormControl fullWidth>
            <InputLabel 
              sx={{ 
                fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                '&.Mui-focused': {
                  color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                },
              }}
            >
              Tone
            </InputLabel>
            <Select
              value={tone}
              onChange={(e) => handleToneChange(e.target.value as ToneType)}
              label="Tone"
              disabled={loading}
              sx={{
                borderRadius: 2.5,
                fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                transition: 'all 0.25s ease',
                '& .MuiSelect-select': {
                  py: 1.75,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                  borderWidth: 1.5,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                  borderWidth: 2,
                },
              }}
              renderValue={(selected) => {
                const option = toneOptions.find(o => o.value === selected);
                return (
                  <Typography sx={{ fontWeight: 500, fontSize: '0.875rem', color: 'text.primary' }}>
                    {option?.label}
                  </Typography>
                );
              }}
            >
              {toneOptions.map((option) => (
                <MenuItem 
                  key={option.value} 
                  value={option.value}
                  sx={{
                    py: 1.5,
                    px: 2.5,
                    borderRadius: 1.5,
                    mx: 1,
                    my: 0.5,
                    transition: 'all 0.2s ease',
                    backgroundColor: tone === option.value ? 'rgba(102, 126, 234, 0.08)' : 'transparent',
                    border: '1px solid',
                    borderColor: tone === option.value ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(102, 126, 234, 0.12)',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.18)',
                      },
                    },
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ 
                      fontWeight: tone === option.value ? 600 : 500, 
                      fontSize: '0.875rem',
                      color: tone === option.value ? '#667eea' : 'text.primary',
                    }}>
                      {option.label}
                    </Typography>
                    <Typography sx={{ 
                      fontSize: '0.7rem', 
                      color: tone === option.value ? 'rgba(102, 126, 234, 0.8)' : 'text.secondary',
                      opacity: 0.8,
                      mt: 0.25,
                    }}>
                      {option.description}
                    </Typography>
                  </Box>
                  {tone === option.value && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: '#667eea',
                        boxShadow: '0 0 12px rgba(102, 126, 234, 0.5)',
                        ml: 1,
                      }}
                    />
                  )}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Style Dropdown - Rich Design */}
          <FormControl fullWidth>
            <InputLabel 
              sx={{ 
                fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                '&.Mui-focused': {
                  color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                },
              }}
            >
              Style
            </InputLabel>
            <Select
              value={style}
              onChange={(e) => handleStyleChange(e.target.value as StyleType)}
              label="Style"
              disabled={loading}
              sx={{
                borderRadius: 2.5,
                fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                transition: 'all 0.25s ease',
                '& .MuiSelect-select': {
                  py: 1.75,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                  borderWidth: 1.5,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                  borderWidth: 2,
                },
              }}
              renderValue={(selected) => {
                const option = styleOptions.find(o => o.value === selected);
                return (
                  <Typography sx={{ fontWeight: 500, fontSize: '0.875rem', color: 'text.primary' }}>
                    {option?.label}
                  </Typography>
                );
              }}
            >
              {styleOptions.map((option) => (
                <MenuItem 
                  key={option.value} 
                  value={option.value}
                  sx={{
                    py: 1.5,
                    px: 2.5,
                    borderRadius: 1.5,
                    mx: 1,
                    my: 0.5,
                    transition: 'all 0.2s ease',
                    backgroundColor: style === option.value ? 'rgba(102, 126, 234, 0.08)' : 'transparent',
                    border: '1px solid',
                    borderColor: style === option.value ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(102, 126, 234, 0.12)',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.18)',
                      },
                    },
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ 
                      fontWeight: style === option.value ? 600 : 500, 
                      fontSize: '0.875rem',
                      color: style === option.value ? '#667eea' : 'text.primary',
                    }}>
                      {option.label}
                    </Typography>
                    <Typography sx={{ 
                      fontSize: '0.7rem', 
                      color: style === option.value ? 'rgba(102, 126, 234, 0.8)' : 'text.secondary',
                      opacity: 0.8,
                      mt: 0.25,
                    }}>
                      {option.description}
                    </Typography>
                  </Box>
                  {style === option.value && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: '#667eea',
                        boxShadow: '0 0 12px rgba(102, 126, 234, 0.5)',
                        ml: 1,
                      }}
                    />
                  )}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Intensity Dropdown - Rich Design */}
          <FormControl fullWidth>
            <InputLabel 
              sx={{ 
                fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                '&.Mui-focused': {
                  color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                },
              }}
            >
              Intensity
            </InputLabel>
            <Select
              value={intensity}
              onChange={(e) => handleIntensityChange(e.target.value as IntensityType)}
              label="Intensity"
              disabled={loading}
              sx={{
                borderRadius: 2.5,
                fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                transition: 'all 0.25s ease',
                '& .MuiSelect-select': {
                  py: 1.75,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                  borderWidth: 1.5,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                  borderWidth: 2,
                },
              }}
              renderValue={(selected) => {
                const option = intensityOptions.find(o => o.value === selected);
                return (
                  <Typography sx={{ fontWeight: 500, fontSize: '0.875rem', color: 'text.primary' }}>
                    {option?.label}
                  </Typography>
                );
              }}
            >
              {intensityOptions.map((option) => (
                <MenuItem 
                  key={option.value} 
                  value={option.value}
                  sx={{
                    py: 1.5,
                    px: 2.5,
                    borderRadius: 1.5,
                    mx: 1,
                    my: 0.5,
                    transition: 'all 0.2s ease',
                    backgroundColor: intensity === option.value ? 'rgba(102, 126, 234, 0.08)' : 'transparent',
                    border: '1px solid',
                    borderColor: intensity === option.value ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(102, 126, 234, 0.12)',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.18)',
                      },
                    },
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ 
                      fontWeight: intensity === option.value ? 600 : 500, 
                      fontSize: '0.875rem',
                      color: intensity === option.value ? '#667eea' : 'text.primary',
                    }}>
                      {option.label}
                    </Typography>
                    <Typography sx={{ 
                      fontSize: '0.7rem', 
                      color: intensity === option.value ? 'rgba(102, 126, 234, 0.8)' : 'text.secondary',
                      opacity: 0.8,
                      mt: 0.25,
                    }}>
                      {option.description}
                    </Typography>
                  </Box>
                  {intensity === option.value && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: '#667eea',
                        boxShadow: '0 0 12px rgba(102, 126, 234, 0.5)',
                        ml: 1,
                      }}
                    />
                  )}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        {/* ========== END RICH DROPDOWN SECTIONS ========== */}

        {/* Intensity Slider */}
        <Box sx={{ mb: 3, px: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ 
              fontWeight: 600,
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              fontSize: '0.8125rem',
              color: 'text.primary',
            }}>
              Rewriting Intensity
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: getIntensityColor(sliderValue),
                  transition: 'background-color 0.3s ease',
                  boxShadow: `0 0 8px ${getIntensityGlow(sliderValue)}`,
                }}
              />
              <Typography variant="caption" sx={{ 
                fontWeight: 600,
                color: getIntensityColor(sliderValue),
                transition: 'color 0.3s ease',
                fontSize: '0.7rem',
              }}>
                {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
              </Typography>
            </Box>
          </Box>
          
          <Slider
            value={sliderValue}
            onChange={(_, value) => {
              const levels: IntensityType[] = ['light', 'medium', 'heavy'];
              const newIntensity = levels[value as number - 1];
              handleIntensityChange(newIntensity);
            }}
            min={1}
            max={3}
            step={1}
            disabled={loading}
            sx={{
              '& .MuiSlider-track': {
                background: `linear-gradient(90deg, ${gradientStart} 0%, ${gradientMid} 50%, ${gradientEnd} 100%)`,
                borderRadius: 3,
                height: 5,
                transition: 'all 0.3s ease',
              },
              '& .MuiSlider-rail': {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                height: 5,
                borderRadius: 3,
              },
              '& .MuiSlider-thumb': {
                width: 18,
                height: 18,
                backgroundColor: getIntensityColor(sliderValue),
                boxShadow: `0 2px 8px ${getIntensityGlow(sliderValue)}`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: `0 2px 12px ${getIntensityGlow(sliderValue)}`,
                  transform: 'scale(1.05)',
                },
                '& .MuiSlider-valueLabel': {
                  backgroundColor: getIntensityColor(sliderValue),
                  borderRadius: 1.5,
                  padding: '1px 8px',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: '#fff',
                  boxShadow: `0 2px 8px ${getIntensityGlow(sliderValue)}`,
                },
              },
              '& .MuiSlider-mark': {
                backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
                height: 8,
                width: 8,
                borderRadius: '50%',
                transition: 'all 0.3s ease',
                '&.MuiSlider-markActive': {
                  backgroundColor: getIntensityColor(sliderValue),
                  boxShadow: `0 0 8px ${getIntensityGlow(sliderValue)}`,
                  transform: 'scale(1.1)',
                },
              },
              '& .MuiSlider-markLabel': {
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
                fontSize: '0.65rem',
                fontWeight: 500,
                fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                transition: 'all 0.3s ease',
              },
            }}
            marks={[
              { value: 1, label: 'Light' },
              { value: 2, label: 'Medium' },
              { value: 3, label: 'Heavy' },
            ]}
          />
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 0.25,
            px: 0.5,
          }}>
            <Typography variant="caption" sx={{ 
              color: sliderValue === 1 ? '#90CAF9' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
              fontWeight: sliderValue === 1 ? 500 : 400,
              transition: 'all 0.3s ease',
              fontSize: '0.55rem',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              letterSpacing: '0.02em',
            }}>
              <span style={{ 
                display: 'inline-block', 
                width: 4, 
                height: 4, 
                borderRadius: '50%', 
                backgroundColor: '#90CAF9',
                opacity: sliderValue === 1 ? 0.8 : 0.2,
              }} />
              Gentle
            </Typography>
            <Typography variant="caption" sx={{ 
              color: sliderValue === 2 ? '#64B5F6' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
              fontWeight: sliderValue === 2 ? 500 : 400,
              transition: 'all 0.3s ease',
              fontSize: '0.55rem',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              letterSpacing: '0.02em',
            }}>
              <span style={{ 
                display: 'inline-block', 
                width: 4, 
                height: 4, 
                borderRadius: '50%', 
                backgroundColor: '#64B5F6',
                opacity: sliderValue === 2 ? 0.8 : 0.2,
              }} />
              Moderate
            </Typography>
            <Typography variant="caption" sx={{ 
              color: sliderValue === 3 ? '#42A5F5' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
              fontWeight: sliderValue === 3 ? 500 : 400,
              transition: 'all 0.3s ease',
              fontSize: '0.55rem',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              letterSpacing: '0.02em',
            }}>
              <span style={{ 
                display: 'inline-block', 
                width: 4, 
                height: 4, 
                borderRadius: '50%', 
                backgroundColor: '#42A5F5',
                opacity: sliderValue === 3 ? 0.8 : 0.2,
              }} />
              Aggressive
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleHumanize}
            disabled={loading || !text.trim()}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome sx={{ fontSize: 22 }} />}
            sx={{
              borderRadius: 3,
              px: 5,
              py: 2,
              fontWeight: 700,
              fontSize: '1rem',
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              boxShadow: '0 4px 24px rgba(102, 126, 234, 0.35)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                transition: 'all 0.6s ease',
              },
              '&:hover': {
                boxShadow: '0 8px 40px rgba(102, 126, 234, 0.5)',
                transform: 'translateY(-3px) scale(1.02)',
                '&::before': {
                  left: '100%',
                },
              },
              '&:active': {
                transform: 'scale(0.96)',
                boxShadow: '0 2px 12px rgba(102, 126, 234, 0.3)',
              },
              '&:disabled': {
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                boxShadow: 'none',
                transform: 'none',
                color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
              },
            }}
          >
            {loading ? 'Humanizing...' : '✨ Humanize Text'}
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            onClick={handleClear}
            disabled={loading || !text}
            startIcon={<Clear sx={{ fontSize: 22 }} />}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 2,
              fontWeight: 600,
              fontSize: '0.9375rem',
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              textTransform: 'none',
              borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
              color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: 'transparent',
              '&:hover': {
                borderColor: '#ef4444',
                color: '#ef4444',
                backgroundColor: alpha('#ef4444', 0.06),
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)',
              },
              '&:active': {
                transform: 'scale(0.96)',
              },
              '&:disabled': {
                borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              },
            }}
          >
            Clear All
          </Button>
        </Box>

        {/* Error Message */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mt: 2.5, borderRadius: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Result Display */}
        {result && (
          <Box sx={{ mt: 4 }}>
            <ResultDisplay 
              result={result} 
              onCopy={handleCopy} 
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Editor;