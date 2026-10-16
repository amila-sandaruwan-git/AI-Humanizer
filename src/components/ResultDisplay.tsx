// src/components/ResultDisplay.tsx

import React, { useState, useCallback, useMemo, memo } from 'react';
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
  Stack,
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

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.humanized);
      setCopied(true);
      showSuccess('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch {
      showError('Failed to copy text');
    }
  }, [result.humanized, showSuccess, showError, onCopy]);

  const handleDownload = useCallback(() => {
    try {
      const blob = new Blob([result.humanized], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'humanized_text.txt';
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('File downloaded');
    } catch {
      showError('Failed to download file');
    }
  }, [result.humanized, showSuccess, showError]);

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Humanized Text', text: result.humanized });
        showSuccess('Shared successfully');
      } else {
        await navigator.clipboard.writeText(result.humanized);
        showInfo('Text copied to clipboard');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        showError('Failed to share');
      }
    }
  }, [result.humanized, showSuccess, showError, showInfo]);

  const similarityScore = useMemo(() => {
    const orig = result.original.toLowerCase().split(' ');
    const hum = result.humanized.toLowerCase().split(' ');
    const origSet = new Set(orig);
    const humSet = new Set(hum);
    let intersection = 0;
    origSet.forEach((w) => {
      if (humSet.has(w)) intersection++;
    });
    return Math.round((intersection / origSet.size) * 100);
  }, [result.original, result.humanized]);

  const similarityInfo = useMemo(() => {
    if (similarityScore >= 70) {
      return {
        color: '#d64a4a',
        bg: isDark ? 'rgba(214, 74, 74, 0.15)' : 'rgba(214, 74, 74, 0.08)',
      };
    }
    if (similarityScore >= 50) {
      return {
        color: '#d98700',
        bg: isDark ? 'rgba(217, 135, 0, 0.15)' : 'rgba(217, 135, 0, 0.08)',
      };
    }
    return {
      color: '#2fa060',
      bg: isDark ? 'rgba(47, 160, 96, 0.15)' : 'rgba(47, 160, 96, 0.08)',
    };
  }, [similarityScore, isDark]);

  const formattedText = useMemo(() => {
    if (!result.humanized) return null;
    const paragraphs = result.humanized.split(/\n\s*\n/);

    return paragraphs.map((paragraph, pIndex) => {
      const lines = paragraph.split(/\n/);

      return (
        <Box key={pIndex} sx={{ mb: pIndex < paragraphs.length - 1 ? 2 : 0 }}>
          {lines.map((line, lIndex) => {
            const trimmed = line.trim();
            if (!trimmed) return <br key={lIndex} />;

            const bulletMatch = trimmed.match(
              /^(\s*)([•·▪◦●■□*\-+]|\d+[.)]|[a-zA-Z][.)])(\s+)/
            );
            if (bulletMatch) {
              const indent = bulletMatch[1] || '';
              const bullet = bulletMatch[2] || '';
              const content = trimmed.substring(bulletMatch[0].length);

              return (
                <Box
                  key={lIndex}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 0.5,
                    pl: indent,
                    py: 0.25,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      color: 'text.primary',
                      fontWeight: 600,
                      minWidth: 20,
                      fontSize: '0.875rem',
                    }}
                  >
                    {bullet}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      color: 'text.primary',
                      fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                      lineHeight: 1.7,
                      flex: 1,
                      minWidth: 0,
                      wordBreak: 'break-word',
                    }}
                  >
                    {content}
                  </Typography>
                </Box>
              );
            }

            const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
            if (headingMatch) {
              const level = headingMatch[1].length;
              const content = headingMatch[2];
              const fontSize =
                level === 1
                  ? '1.35rem'
                  : level === 2
                  ? '1.15rem'
                  : level === 3
                  ? '1.05rem'
                  : '0.9375rem';
              const fontWeight = level <= 3 ? 700 : 600;

              return (
                <Typography
                  key={lIndex}
                  sx={{
                    fontWeight,
                    fontSize,
                    color: 'text.primary',
                    mt: lIndex > 0 ? 1.5 : 0,
                    mb: 0.5,
                    wordBreak: 'break-word',
                  }}
                >
                  {content}
                </Typography>
              );
            }

            return (
              <Typography
                key={lIndex}
                sx={{
                  color: 'text.primary',
                  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                  lineHeight: 1.7,
                  py: 0.25,
                  wordBreak: 'break-word',
                }}
              >
                {trimmed}
              </Typography>
            );
          })}
        </Box>
      );
    });
  }, [result.humanized]);

  return (
    <Box sx={{ mt: { xs: 2.5, sm: 3, md: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.75, sm: 2.5, md: 3 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: isDark
            ? 'rgba(255,255,255,0.02)'
            : 'rgba(255,255,255,0.7)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              fontSize: { xs: '1rem', sm: '1.15rem' },
            }}
          >
            Humanized Result
          </Typography>

          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 0.5,
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-end' },
            }}
          >
            <Tooltip title={`${similarityScore}% similar to original text`}>
              <Chip
                label={`${similarityScore}% similar`}
                size="small"
                sx={{
                  backgroundColor: similarityInfo.bg,
                  color: similarityInfo.color,
                  fontWeight: 600,
                  border: `1px solid ${similarityInfo.color}40`,
                  '& .MuiChip-label': { px: 1.5 },
                  fontSize: '0.7rem',
                  height: 26,
                }}
              />
            </Tooltip>

            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                <IconButton
                  onClick={handleCopy}
                  color={copied ? 'success' : 'primary'}
                  size="small"
                  aria-label="Copy"
                  sx={{ width: 36, height: 36 }}
                >
                  {copied ? <CheckCircle /> : <ContentCopy />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Download as TXT">
                <IconButton
                  onClick={handleDownload}
                  color="info"
                  size="small"
                  aria-label="Download"
                  sx={{ width: 36, height: 36 }}
                >
                  <Download />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share">
                <IconButton
                  onClick={handleShare}
                  color="secondary"
                  size="small"
                  aria-label="Share"
                  sx={{ width: 36, height: 36 }}
                >
                  <Share />
                </IconButton>
              </Tooltip>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ mb: 2.5 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 0.5,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontSize: '0.65rem', fontWeight: 500 }}
            >
              Similarity Score
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: similarityInfo.color,
                fontWeight: 700,
                fontSize: '0.7rem',
              }}
            >
              {similarityScore}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={similarityScore}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(43,47,69,0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                backgroundColor: similarityInfo.color,
              },
            }}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Card
          variant="outlined"
          sx={{ borderColor: 'primary.main', backgroundColor: 'transparent' }}
        >
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
            <Typography
              variant="subtitle2"
              color="primary"
              gutterBottom
              sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
            >
              Humanized Text ({result.wordCount.humanized} words)
            </Typography>
            <Box
              sx={{
                maxHeight: { xs: 320, sm: 400 },
                overflow: 'auto',
                backgroundColor: 'transparent',
                p: { xs: 1, sm: 1.5 },
                borderRadius: 1,
                wordWrap: 'break-word',
                color: 'text.primary',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {formattedText}
            </Box>
          </CardContent>
        </Card>

        {result.changes && (
          <Box
            sx={{
              mt: { xs: 2, sm: 3 },
              p: { xs: 1.5, sm: 2 },
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(43,47,69,0.04)',
              borderRadius: 2,
            }}
          >
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ color: 'text.primary', fontSize: '0.8125rem' }}
            >
              Changes Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`${result.changes.sentencesRewritten} sentences rewritten`}
                color="info"
                size="small"
                sx={{ fontSize: '0.7rem' }}
              />
              <Chip
                label={`${result.changes.wordsChanged} words changed`}
                color="info"
                size="small"
                sx={{ fontSize: '0.7rem' }}
              />
              <Chip
                label={`${result.wordCount.original} to ${result.wordCount.humanized} words`}
                color="default"
                size="small"
                sx={{ fontSize: '0.7rem' }}
              />
            </Box>
          </Box>
        )}

        <Alert
          severity="info"
          sx={{
            mt: 2,
            borderRadius: 2,
            backgroundColor: isDark
              ? 'rgba(102,126,234,0.1)'
              : 'rgba(91,111,214,0.06)',
            border: '1px solid',
            borderColor: isDark
              ? 'rgba(102,126,234,0.2)'
              : 'rgba(91,111,214,0.15)',
            '& .MuiAlert-icon': { color: '#5b6fd6' },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'text.primary',
              fontSize: { xs: '0.75rem', sm: '0.8125rem' },
              lineHeight: 1.6,
            }}
          >
            Tip: For best results, review and personalize the humanized text to match
            your unique voice and style.
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
};

export default memo(ResultDisplay);