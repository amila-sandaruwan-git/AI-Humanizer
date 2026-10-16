// src/components/Hero.tsx  (NEW, purely presentational — no state, no logic)

import React from 'react';
import { Box, Typography, Stack, Chip } from '@mui/material';
import { brandGradient } from '../styles/theme';

const Hero: React.FC = () => (
  <Box sx={{ textAlign: 'center', pt: { xs: 9, sm: 11, md: 12 }, pb: { xs: 3, md: 4 } }}>
    <Chip
      className="rise"
      label="Free • No login • Works offline"
      size="small"
      sx={{
        mb: 2.5,
        px: 0.5,
        fontWeight: 600,
        border: '1px solid rgba(102,126,234,0.3)',
        backgroundColor: 'rgba(102,126,234,0.08)',
        color: 'primary.main',
      }}
    />
    <Typography
      className="rise rise-2"
      component="h1"
      sx={{
        fontSize: { xs: '2.2rem', sm: '3rem', md: '3.75rem' },
        fontWeight: 800,
        letterSpacing: '-0.04em',
        lineHeight: 1.08,
        maxWidth: 820,
        mx: 'auto',
      }}
    >
      Make AI text sound{' '}
      <Box
        component="span"
        sx={{
          background: brandGradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        genuinely human
      </Box>
    </Typography>
    <Typography
      className="rise rise-3"
      sx={{ mt: 2, color: 'text.secondary', fontSize: { xs: '1rem', md: '1.15rem' }, maxWidth: 620, mx: 'auto' }}
    >
      Paste your draft, pick a tone and intensity, and get natural writing back — all processed privately in your browser.
    </Typography>
    <Stack direction="row" spacing={3} justifyContent="center" sx={{ mt: 3, color: 'text.secondary', fontSize: '0.85rem', fontWeight: 500 }}>
      <span>🔒 Private</span>
      <span>⚡ Instant</span>
      <span>🎯 Meaning preserved</span>
    </Stack>
  </Box>
);

export default Hero;