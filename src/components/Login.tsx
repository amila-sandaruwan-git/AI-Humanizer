import React from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Divider,
  Stack,
  CircularProgress,
} from '@mui/material';
import { Google, Facebook } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { signInWithGoogle, signInWithFacebook, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
          borderRadius: 4,
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Welcome Back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Sign in to continue using AI Humanizer
        </Typography>

        <Stack spacing={2}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<Google />}
            onClick={signInWithGoogle}
            sx={{
              py: 1.5,
              bgcolor: '#4285f4',
              '&:hover': { bgcolor: '#357ae8' },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Continue with Google
          </Button>

          <Button
            variant="contained"
            fullWidth
            startIcon={<Facebook />}
            onClick={signInWithFacebook}
            sx={{
              py: 1.5,
              bgcolor: '#1877f2',
              '&:hover': { bgcolor: '#166fe5' },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Continue with Facebook
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="text.secondary">
            or continue with
          </Typography>
        </Divider>

        <Typography variant="caption" color="text.secondary">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Typography>
      </Paper>
    </Box>
  );
};