// src/components/Editor.tsx


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
  Chip,
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
  Speed,
  Style as StyleIcon,
  Tune,
  Description,
  CheckCircle,
  Gradient,
} from '@mui/icons-material';
import { humanizeText } from '../services/aiService';
import { HumanizeResponse, ToneType, StyleType, IntensityType } from '../types';
import ResultDisplay from './ResultDisplay';
import FileUpload from './FileUpload';
import { useToast } from '../context/ToastContext';
import { useUndo } from '../hooks/useUndo';

interface EditorProps {
  onHumanize: (result: HumanizeResponse) => void;
  isAuthenticated?: boolean;
  onAuthRequired?: () => void;
}

const Editor: React.FC<EditorProps> = ({ 
  onHumanize, 
  isAuthenticated = false,
  onAuthRequired 
}) => {
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
        if (!isAuthenticated && onAuthRequired) {
          onAuthRequired();
          return;
        }
        const previousText = undo();
        if (previousText !== undefined) {
          showInfo('Undo ✅');
        }
        return;
      }
      
      if (isCtrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated && onAuthRequired) {
          onAuthRequired();
          return;
        }
        const nextText = redo();
        if (nextText !== undefined) {
          showInfo('Redo 🔄');
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [undo, redo, showInfo, isAuthenticated, onAuthRequired]);

  const handleUndo = () => {
    if (!isAuthenticated && onAuthRequired) {
      onAuthRequired();
      return;
    }
    const previousText = undo();
    if (previousText !== undefined) {
      showInfo('Undo ✅');
    }
    return previousText;
  };

  const handleRedo = () => {
    if (!isAuthenticated && onAuthRequired) {
      onAuthRequired();
      return;
    }
    const nextText = redo();
    if (nextText !== undefined) {
      showInfo('Redo 🔄');
    }
    return nextText;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated && onAuthRequired) {
      onAuthRequired();
      return;
    }
    const newText = e.target.value;
    setText(newText);
  };

  const handleFileContent = (content: string, name: string) => {
    if (!isAuthenticated && onAuthRequired) {
      onAuthRequired();
      return;
    }
    const separator = text ? '\n\n' : '';
    const newText = text + separator + content;
    setTextImmediate(newText);
    setFileName(name);
    setShowFileUpload(false);
    showInfo(`File "${name}" loaded successfully! 📄`);
  };

  const handleFileUploadClick = () => {
    if (!isAuthenticated && onAuthRequired) {
      onAuthRequired();
      return;
    }
    setShowFileUpload(!showFileUpload);
  };

  const handleRemoveFileContent = () => {
    if (!isAuthenticated && onAuthRequired) {
      onAuthRequired();
      return;
    }
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
    if (!isAuthenticated && onAuthRequired) {
      onAuthRequired();
      return;
    }

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
    if (!isAuthenticated && onAuthRequired) {
      onAuthRequired();
      return;
    }
    setTextImmediate('');
    clearHistory();
    setResult(null);
    setError(null);
    setFileName(null);
    showInfo('Cleared all text 🗑️');
  };

  const handleCopy = async () => {
    if (!isAuthenticated && onAuthRequired) {
      onAuthRequired();
      return;
    }
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
    if (!isAuthenticated && onAuthRequired) {
      onAuthRequired();
      return;
    }
    setTone(value);
    showInfo(`Tone changed to: ${value.charAt(0).toUpperCase() + value.slice(1)}`);
  };

  const handleIntensityChange = (value: IntensityType) => {
    if (!isAuthenticated && onAuthRequired) {
      onAuthRequired();
      return;
    }
    setIntensity(value);
    showInfo(`Intensity changed to: ${value.charAt(0).toUpperCase() + value.slice(1)}`);
  };

  const handleStyleChange = (value: StyleType) => {
    if (!isAuthenticated && onAuthRequired) {
      onAuthRequired();
      return;
    }
    setStyle(value);
    showInfo(`Style changed to: ${value.charAt(0).toUpperCase() + value.slice(1)}`);
  };

  // Get intensity color
  const getIntensityColor = (level: IntensityType) => {
    switch (level) {
      case 'light': return isDark ? '#4CAF50' : '#43A047';
      case 'medium': return isDark ? '#FF9800' : '#F57C00';
      case 'heavy': return isDark ? '#EF5350' : '#D32F2F';
      default: return 'primary.main';
    }
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            
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

        {/* Status Bar - Clean, No Background or Border */}
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
            {fileName && (
              <Chip 
                label={fileName} 
                size="small" 
                variant="outlined"
                sx={{ height: 20, fontSize: '0.6rem' }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {canUndo || canRedo ? (
              <Typography variant="caption" color="text.secondary" sx={{ 
                fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                fontSize: '0.65rem',
              }}>
                
              </Typography>
            ) : null}
          </Box>
        </Box>

        {/* Controls Section */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} sx={{ mb: 3.5 }}>
          <FormControl fullWidth>
            <InputLabel sx={{ 
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              fontSize: '0.875rem',
            }}>
              Tone
            </InputLabel>
            <Select
              value={tone}
              onChange={(e) => handleToneChange(e.target.value as ToneType)}
              label="Tone"
              disabled={loading}
              sx={{
                borderRadius: 2,
                fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                '& .MuiSelect-select': {
                  py: 1.75,
                  fontSize: '0.875rem',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'divider',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
              }}
            >
              <MenuItem value="professional">Professional</MenuItem>
              <MenuItem value="casual">Casual</MenuItem>
              <MenuItem value="academic">Academic</MenuItem>
              <MenuItem value="creative">Creative</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel sx={{ 
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              fontSize: '0.875rem',
            }}>
              Style
            </InputLabel>
            <Select
              value={style}
              onChange={(e) => handleStyleChange(e.target.value as StyleType)}
              label="Style"
              disabled={loading}
              sx={{
                borderRadius: 2,
                fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                '& .MuiSelect-select': {
                  py: 1.75,
                  fontSize: '0.875rem',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'divider',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
              }}
            >
              <MenuItem value="concise">Concise</MenuItem>
              <MenuItem value="balanced">Balanced</MenuItem>
              <MenuItem value="detailed">Detailed</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel sx={{ 
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              fontSize: '0.875rem',
            }}>
              Intensity
            </InputLabel>
            <Select
              value={intensity}
              onChange={(e) => handleIntensityChange(e.target.value as IntensityType)}
              label="Intensity"
              disabled={loading}
              sx={{
                borderRadius: 2,
                fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                '& .MuiSelect-select': {
                  py: 1.75,
                  fontSize: '0.875rem',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'divider',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
              }}
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="heavy">Heavy</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Intensity Slider */}
        <Box sx={{ mb: 4, px: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="body2" sx={{ 
              fontWeight: 600,
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              fontSize: '0.875rem',
              color: 'text.primary',
            }}>
              Rewriting Intensity
            </Typography>
            
          </Box>
          <Slider
            value={intensity === 'light' ? 1 : intensity === 'medium' ? 2 : 3}
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
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 4,
                height: 6,
              },
              '& .MuiSlider-rail': {
                backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                height: 6,
                borderRadius: 4,
              },
              '& .MuiSlider-thumb': {
                width: 22,
                height: 22,
                backgroundColor: '#667eea',
                boxShadow: '0 2px 12px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.5)',
                },
                '& .MuiSlider-valueLabel': {
                  backgroundColor: 'primary.main',
                  borderRadius: 2,
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                },
              },
            }}
            marks={[
              { value: 1, label: 'Light' },
              { value: 2, label: 'Medium' },
              { value: 3, label: 'Heavy' },
            ]}
          />
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
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.75,
              fontWeight: 700,
              fontSize: '0.9375rem',
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 24px rgba(102, 126, 234, 0.35)',
              '&:hover': {
                boxShadow: '0 6px 32px rgba(102, 126, 234, 0.5)',
                transform: 'translateY(-2px)',
              },
              '&:disabled': {
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                boxShadow: 'none',
                transform: 'none',
              },
            }}
          >
            {loading ? 'Humanizing...' : 'Humanize Text'}
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            onClick={handleClear}
            disabled={loading || !text}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.75,
              fontWeight: 600,
              fontSize: '0.9375rem',
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              textTransform: 'none',
              borderColor: 'divider',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'error.main',
                color: 'error.main',
                backgroundColor: alpha(theme.palette.error.main, 0.04),
              },
            }}
          >
            Clear
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