import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  Divider,
} from '@mui/material';
import {
  ContentCopy,
  CheckCircle,
  Download,
  Share,
} from '@mui/icons-material';
import { HumanizeResponse } from '../types';
import { useToast } from '../context/ToastContext';

interface ResultDisplayProps {
  result: HumanizeResponse;
  onCopy?: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const { showSuccess, showError, showInfo } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.humanized);
      setCopied(true);
      showSuccess('Copied to clipboard! 📋');
      setTimeout(() => setCopied(false), 2000);
      if (onCopy) onCopy();
    } catch (err) {
      console.error('Failed to copy:', err);
      showError('Failed to copy text');
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([result.humanized], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'humanized_text.txt';
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('File downloaded successfully! 📥');
    } catch (err) {
      showError('Failed to download file');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Humanized Text',
          text: result.humanized,
        });
        showSuccess('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(result.humanized);
        showInfo('Text copied to clipboard! You can share it now.');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        showError('Failed to share');
      }
    }
  };

  const calculateSimilarity = () => {
    const originalWords = result.original.toLowerCase().split(' ');
    const humanizedWords = result.humanized.toLowerCase().split(' ');
    const originalSet = new Set(originalWords);
    const humanizedSet = new Set(humanizedWords);
    
    const intersection = new Set(
      Array.from(originalSet).filter(word => humanizedSet.has(word))
    );
    return Math.round((intersection.size / originalSet.size) * 100);
  };

  const similarityScore = calculateSimilarity();

  // Determine color based on similarity
  const getSimilarityColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score <= 40) return 'success';
    if (score <= 60) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box 
          sx={{ 
            display: 'flex',
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2 
          }}
        >
          <Typography variant="h6">
            Humanized Result
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={`${similarityScore}% similar`}
              color={getSimilarityColor(similarityScore)}
              size="small"
            />
            <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
              <IconButton onClick={handleCopy} color={copied ? 'success' : 'primary'}>
                {copied ? <CheckCircle /> : <ContentCopy />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Download as TXT">
              <IconButton onClick={handleDownload} color="info">
                <Download />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton onClick={handleShare} color="secondary">
                <Share />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Only Humanized Text */}
        <Card variant="outlined" sx={{ borderColor: 'primary.main' }}>
          <CardContent>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Humanized Text ({result.wordCount.humanized} words)
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                maxHeight: 300, 
                overflow: 'auto',
                backgroundColor: 'transparent',
                p: 2,
                borderRadius: 1,
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                color: 'text.primary', // This ensures text is visible in dark mode
              }}
            >
              {result.humanized}
            </Typography>
          </CardContent>
        </Card>

        {result.changes && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Changes Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`${result.changes.sentencesRewritten} sentences rewritten`}
                color="info"
                size="small"
              />
              <Chip 
                label={`${result.changes.wordsChanged} words changed`}
                color="info"
                size="small"
              />
              <Chip 
                label={`${result.wordCount.original} → ${result.wordCount.humanized} words`}
                color="default"
                size="small"
              />
            </Box>
          </Box>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            💡 Tip: For best results, review and personalize the humanized text to match your unique voice and style.
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
};

export default ResultDisplay;