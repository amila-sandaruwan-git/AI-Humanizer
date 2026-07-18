import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Divider,
  useTheme,
  LinearProgress,
  alpha,
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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
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

  // Determine color based on similarity score
  const getSimilarityColor = (score: number): { color: string; bg: string; label: string } => {
    if (score >= 70) {
      return {
        color: '#ef4444',
        bg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
        label: 'High Similarity'
      };
    } else if (score >= 50) {
      return {
        color: '#f59e0b',
        bg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)',
        label: 'Medium Similarity'
      };
    } else {
      return {
        color: '#22c55e',
        bg: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)',
        label: 'Low Similarity'
      };
    }
  };

  const similarityInfo = getSimilarityColor(similarityScore);

  // Get progress color for LinearProgress
  const getProgressColor = (score: number): string => {
    if (score >= 70) return '#ef4444';
    if (score >= 50) return '#f59e0b';
    return '#22c55e';
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        }}
      >
        <Box 
          sx={{ 
            display: 'flex',
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Humanized Result
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Similarity Chip with Color */}
            <Tooltip title={`${similarityScore}% similar to original text`}>
              <Chip 
                label={`${similarityScore}% similar`}
                size="small"
                sx={{
                  backgroundColor: similarityInfo.bg,
                  color: similarityInfo.color,
                  fontWeight: 600,
                  border: `1px solid ${similarityInfo.color}40`,
                  '& .MuiChip-label': {
                    px: 1.5,
                  },
                }}
              />
            </Tooltip>
            
            <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
              <IconButton onClick={handleCopy} color={copied ? 'success' : 'primary'} size="small">
                {copied ? <CheckCircle /> : <ContentCopy />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Download as TXT">
              <IconButton onClick={handleDownload} color="info" size="small">
                <Download />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton onClick={handleShare} color="secondary" size="small">
                <Share />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Similarity Progress Bar */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ 
              color: 'text.secondary',
              fontSize: '0.65rem',
              fontWeight: 500,
            }}>
              Similarity Score
            </Typography>
            <Typography variant="caption" sx={{ 
              color: similarityInfo.color,
              fontWeight: 700,
              fontSize: '0.7rem',
            }}>
              {similarityScore}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={similarityScore}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                backgroundColor: getProgressColor(similarityScore),
                transition: 'all 0.5s ease',
              },
            }}
          />
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 0.25,
          }}>
            <Typography variant="caption" sx={{ 
              color: 'text.secondary',
              fontSize: '0.5rem',
              opacity: 0.5,
            }}>
              Less Humanized
            </Typography>
            <Typography variant="caption" sx={{ 
              color: 'text.secondary',
              fontSize: '0.5rem',
              opacity: 0.5,
            }}>
              More Humanized
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Card 
          variant="outlined" 
          sx={{ 
            borderColor: 'primary.main',
            backgroundColor: 'transparent',
          }}
        >
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
                color: 'text.primary',
                fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              }}
            >
              {result.humanized}
            </Typography>
          </CardContent>
        </Card>

        {result.changes && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.primary' }}>
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

        <Alert 
          severity="info" 
          sx={{ 
            mt: 2, 
            borderRadius: 2,
            backgroundColor: isDark ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.04)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(102,126,234,0.2)' : 'rgba(102,126,234,0.15)',
            '& .MuiAlert-icon': { color: '#667eea' },
          }}
        >
          <Typography variant="body2" sx={{ fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif', color: 'text.primary' }}>
            Tip: For best results, review and personalize the humanized text to match your unique voice and style.
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
};

export default ResultDisplay;