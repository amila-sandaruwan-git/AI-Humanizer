import React, { useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Button,
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
  BarChart,
  Refresh,
} from '@mui/icons-material';
import { HumanizeResponse } from '../types';

interface ResultDisplayProps {
  result: HumanizeResponse;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.humanized);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const calculateSimilarity = () => {
    const originalWords = result.original.toLowerCase().split(' ');
    const humanizedWords = result.humanized.toLowerCase().split(' ');
    const originalSet = new Set(originalWords);
    const humanizedSet = new Set(humanizedWords);
    
    // Fix: Use Array.from() instead of spread operator for Set
    const intersection = new Set(
      Array.from(originalSet).filter(word => humanizedSet.has(word))
    );
    return Math.round((intersection.size / originalSet.size) * 100);
  };

  const similarityScore = calculateSimilarity();

  return (
    <Box sx={{ mt: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        {/* Fix: Use sx with display:flex instead of justifyContent on Stack */}
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
            
            <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
              <IconButton onClick={handleCopy} color={copied ? 'success' : 'primary'}>
                {copied ? <CheckCircle /> : <ContentCopy />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Fix: Use Grid2 or standard Box with flex for better compatibility */}
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
        
      </Paper>
    </Box>
  );
};

export default ResultDisplay;