import React, { useState } from 'react';
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
} from '@mui/material'; // Removed Chip as it's not used
import { humanizeText } from '../services/aiService';
import { HumanizeResponse, ToneType, StyleType, IntensityType } from '../types';
import ResultDisplay from './ResultDisplay';

interface EditorProps {
  onHumanize: (result: HumanizeResponse) => void;
}

const Editor: React.FC<EditorProps> = ({ onHumanize }) => {
  const [text, setText] = useState('');
  const [tone, setTone] = useState<ToneType>('professional');
  const [style, setStyle] = useState<StyleType>('balanced');
  const [intensity, setIntensity] = useState<IntensityType>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HumanizeResponse | null>(null);

  const handleHumanize = async () => {
    if (!text.trim()) {
      setError('Please enter some text to humanize');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await humanizeText({
        text,
        tone,
        style,
        intensity,
      });
      
      setResult(response);
      onHumanize(response);
    } catch (err) {
      setError('Failed to humanize text. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setResult(null);
    setError(null);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          AI Text Humanizer
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Transform AI-generated text into natural, human-like content
        </Typography>

        {/* Input area */}
        <TextField
          fullWidth
          multiline
          rows={8}
          variant="outlined"
          placeholder="Paste your AI-generated text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          sx={{ mb: 3 }}
        />

        {/* Controls */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Tone</InputLabel>
            <Select
              value={tone}
              onChange={(e) => setTone(e.target.value as ToneType)}
              label="Tone"
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
              onChange={(e) => setIntensity(e.target.value as IntensityType)}
              label="Intensity"
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
              setIntensity(levels[value as number - 1]);
            }}
            min={1}
            max={3}
            step={1}
            marks={[
              { value: 1, label: 'Light' },
              { value: 2, label: 'Medium' },
              { value: 3, label: 'Heavy' },
            ]}
          />
        </Box>

        {/* Action buttons */}
        <Stack direction="row" spacing={2}>
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
            disabled={loading}
          >
            Clear
          </Button>
        </Stack>

        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Result display */}
        {result && (
          <Box sx={{ mt: 4 }}>
            <ResultDisplay result={result} />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Editor;