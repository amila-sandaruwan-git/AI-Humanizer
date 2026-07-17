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
} from '@mui/material';
import {
  Undo,
  Redo,
  Clear,
  UploadFile,
  Close,
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
  const [tone, setTone] = useState<ToneType>('professional');
  const [style, setStyle] = useState<StyleType>('balanced');
  const [intensity, setIntensity] = useState<IntensityType>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HumanizeResponse | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  
  // Use Undo/Redo hook for text
  const {
    value: text,
    setValue: setText,
    setValueImmediate: setTextImmediate,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  } = useUndo<string>('', { maxHistory: 50, debounceTime: 300 });
  
  // Use Toast hook
  const { showSuccess, showError, showInfo, showLoading, dismissToast } = useToast();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z for Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z or Ctrl+Y for Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo]);

  const handleUndo = () => {
    const previousText = undo();
    showInfo('Undo ✅');
    return previousText;
  };

  const handleRedo = () => {
    const nextText = redo();
    showInfo('Redo 🔄');
    return nextText;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);
  };

  const handleFileContent = (content: string, name: string) => {
    // Append file content to existing text with a separator
    const separator = text ? '\n\n' : '';
    const newText = text + separator + content;
    setTextImmediate(newText);
    setFileName(name);
    setShowFileUpload(false);
    showInfo(`File "${name}" loaded successfully! 📄`);
  };

  const handleRemoveFileContent = () => {
    // Remove the file content from the text
    // This is a simple approach - you might want to be more sophisticated
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

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              AI Text Humanizer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Transform AI-generated text into natural, human-like content
            </Typography>
          </Box>
          
          {/* Undo/Redo Controls */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Import File">
              <IconButton 
                onClick={() => setShowFileUpload(!showFileUpload)}
                color="primary"
                disabled={loading}
              >
                <UploadFile />
              </IconButton>
            </Tooltip>
            <Tooltip title={`Undo (Ctrl+Z)${!canUndo ? ' - No actions to undo' : ''}`}>
              <span>
                <IconButton 
                  onClick={handleUndo} 
                  disabled={!canUndo || loading}
                  color="primary"
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
                  color="primary"
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
                  color="error"
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

        {/* Input area */}
        <TextField
          fullWidth
          multiline
          rows={8}
          variant="outlined"
          placeholder="Paste your AI-generated text here or upload a file..."
          value={text}
          onChange={handleTextChange}
          sx={{ 
            mb: 2,
            '& .MuiInputBase-root': {
              fontFamily: 'inherit',
              fontSize: '1rem',
              lineHeight: 1.6,
            }
          }}
          disabled={loading}
        />

        {/* Undo/Redo status bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {text ? `${text.split(/\s+/).filter(w => w).length} words, ${text.length} characters` : 'No text entered'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {canUndo || canRedo ? `History: ${canUndo ? '↩️' : ''} ${canRedo ? '↪️' : ''}` : ''}
            {fileName && ` • 📄 ${fileName}`}
          </Typography>
        </Box>

        {/* Controls */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Tone</InputLabel>
            <Select
              value={tone}
              onChange={(e) => handleToneChange(e.target.value as ToneType)}
              label="Tone"
              disabled={loading}
            >
              <MenuItem value="professional">Professional</MenuItem>
              <MenuItem value="casual">Casual</MenuItem>
              <MenuItem value="academic">Academic</MenuItem>
              <MenuItem value="creative">Creative</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Style</InputLabel>
            <Select
              value={style}
              onChange={(e) => setStyle(e.target.value as StyleType)}
              label="Style"
              disabled={loading}
            >
              <MenuItem value="concise">Concise</MenuItem>
              <MenuItem value="balanced">Balanced</MenuItem>
              <MenuItem value="detailed">Detailed</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Intensity</InputLabel>
            <Select
              value={intensity}
              onChange={(e) => handleIntensityChange(e.target.value as IntensityType)}
              label="Intensity"
              disabled={loading}
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="heavy">Heavy</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Intensity slider */}
        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>
            Rewriting Intensity: {intensity}
          </Typography>
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
            marks={[
              { value: 1, label: 'Light' },
              { value: 2, label: 'Medium' },
              { value: 3, label: 'Heavy' },
            ]}
          />
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleHumanize}
            disabled={loading || !text.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Humanizing...' : 'Humanize Text'}
          </Button>
          <Button
            variant="outlined"
            onClick={handleClear}
            disabled={loading || !text}
          >
            Clear
          </Button>
          {result && (
            <Button
              variant="outlined"
              color="success"
              onClick={handleCopy}
              disabled={loading}
            >
              Copy Result
            </Button>
          )}
        </Box>

        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Result display */}
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