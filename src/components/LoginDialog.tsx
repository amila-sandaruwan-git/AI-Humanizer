import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Stack,
  Divider,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { Google, Facebook, Close } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({ open, onClose }) => {
  const { signInWithGoogle, signInWithFacebook } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [loading, setLoading] = useState<'google' | 'facebook' | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading('google');
    try {
      await signInWithGoogle();
      onClose();
    } catch (error) {
      console.error('Google sign in error:', error);
      setLoading(null);
    }
  };

  const handleFacebookSignIn = async () => {
    setLoading('facebook');
    try {
      await signInWithFacebook();
      onClose();
    } catch (error) {
      console.error('Facebook sign in error:', error);
      setLoading(null);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            p: { xs: 2.5, sm: 3 },
            backgroundColor: isDark ? '#14141e' : '#ffffff',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
            boxShadow: isDark 
              ? '0 20px 60px rgba(0,0,0,0.5)' 
              : '0 20px 60px rgba(0,0,0,0.06)',
            position: 'relative',
            overflow: 'hidden',
          },
        },
      }}
    >
      {/* Top Gradient Accent */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        }}
      />

      {/* Close Button - Top Right */}
      <IconButton 
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          color: 'text.secondary',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.5,
          p: 0.75,
          zIndex: 2,
          transition: 'all 0.25s ease',
          '&:hover': {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            borderColor: 'primary.main',
            transform: 'rotate(90deg)',
          },
        }}
      >
        <Close sx={{ fontSize: 16 }} />
      </IconButton>

      {/* Decorative Background */}
      <Box
        sx={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: isDark 
            ? 'radial-gradient(circle, rgba(102,126,234,0.06) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(102,126,234,0.03) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <DialogTitle sx={{ 
        textAlign: 'center',
        pb: 1,
        px: 0,
        pt: 3,
        position: 'relative',
        zIndex: 1,
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 700,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          color: 'text.primary',
          fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
          letterSpacing: '-0.02em',
          mb: 0.25,
        }}>
          Welcome Back
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary',
            fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
            fontSize: '0.8125rem',
            opacity: 0.6,
          }}
        >
          Sign in to continue
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ 
        px: 0, 
        position: 'relative', 
        zIndex: 1, 
        pt: 0.5,
        pb: 0.5,
      }}>
        <Stack spacing={2}>
          {/* Google Button */}
          <Button
            variant="outlined"
            fullWidth
            onClick={handleGoogleSignIn}
            disabled={loading !== null}
            sx={{
              py: 1.75,
              px: 3,
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8f9fa',
              color: isDark ? '#ffffff' : '#1a1a2e',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
              borderRadius: 2.5,
              transition: 'all 0.25s ease',
              '&:hover': { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f3f4',
                borderColor: '#4285f4',
                boxShadow: '0 4px 16px rgba(66, 133, 244, 0.15)',
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0px)',
              },
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              justifyContent: 'center',
              gap: 2,
            }}
            startIcon={
              loading === 'google' ? (
                <CircularProgress size={20} sx={{ color: '#4285f4' }} />
              ) : (
                <Google sx={{ fontSize: 20, color: '#4285f4' }} />
              )
            }
          >
            {loading === 'google' ? 'Redirecting...' : 'Continue with Google'}
          </Button>

          {/* Facebook Button */}
          <Button
            variant="outlined"
            fullWidth
            onClick={handleFacebookSignIn}
            disabled={loading !== null}
            sx={{
              py: 1.75,
              px: 3,
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8f9fa',
              color: isDark ? '#ffffff' : '#1a1a2e',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
              borderRadius: 2.5,
              transition: 'all 0.25s ease',
              '&:hover': { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f3f4',
                borderColor: '#1877f2',
                boxShadow: '0 4px 16px rgba(24, 119, 242, 0.15)',
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0px)',
              },
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
              justifyContent: 'center',
              gap: 2,
            }}
            startIcon={
              loading === 'facebook' ? (
                <CircularProgress size={20} sx={{ color: '#1877f2' }} />
              ) : (
                <Facebook sx={{ fontSize: 20, color: '#1877f2' }} />
              )
            }
          >
            {loading === 'facebook' ? 'Redirecting...' : 'Continue with Facebook'}
          </Button>
        </Stack>

        <Box sx={{ 
          my: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}>
          <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
          <Typography variant="caption" sx={{ 
            color: 'text.secondary',
            fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
            fontSize: '0.6rem',
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            opacity: 0.4,
          }}>
            Secure & Private
          </Typography>
          <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
        </Box>

        <Box sx={{ 
          textAlign: 'center',
        }}>
          <Typography variant="caption" sx={{ 
            color: 'text.secondary',
            fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
            fontSize: '0.6rem',
            opacity: 0.4,
          }}>
            By signing in, you agree to our Terms
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};