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
        <Stack 
          direction="row" 
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
          <Stack direction="row" spacing={1}>
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
          </Stack>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Original Text ({result.wordCount.original} words)
                </Typography>
                <Typography variant="body2" sx={{ 
                  maxHeight: 200, 
                  overflow: 'auto',
                  backgroundColor: '#f5f5f5',
                  p: 2,
                  borderRadius: 1,
                }}>
                  {result.original}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Card variant="outlined" sx={{ borderColor: 'primary.main' }}>
              <CardContent>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Humanized Text ({result.wordCount.humanized} words)
                </Typography>
                <Typography variant="body2" sx={{ 
                  maxHeight: 200, 
                  overflow: 'auto',
                  backgroundColor: '#e3f2fd',
                  p: 2,
                  borderRadius: 1,
                }}>
                  {result.humanized}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {result.changes && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Changes Summary
            </Typography>
            <Stack direction="row" spacing={3}>
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
            </Stack>
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