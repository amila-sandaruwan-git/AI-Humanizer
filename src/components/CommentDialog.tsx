// src/components/CommentDialog.tsx

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close, Edit, Save, Cancel } from '@mui/icons-material';
import { CommentUser } from '../types/comment';

interface CommentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (user: CommentUser) => void;
  onUpdate?: (user: CommentUser) => Promise<void>;
  title?: string;
  submitLabel?: string;
  updateLabel?: string;
  initialName?: string;
  initialEmail?: string;
  initialAnonymous?: boolean;
  existingUser?: {
    email: string;
    name: string;
    is_anonymous: boolean;
  } | null;
  isEditing?: boolean;
}

const CommentDialog: React.FC<CommentDialogProps> = ({
  open,
  onClose,
  onSubmit,
  onUpdate,
  title = 'Add Your Details',
  submitLabel = 'Continue',
  updateLabel = 'Save Changes',
  initialName = '',
  initialEmail = '',
  initialAnonymous = false,
  existingUser = null,
  isEditing = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [isAnonymous, setIsAnonymous] = useState(initialAnonymous);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showChangeOption, setShowChangeOption] = useState(false);

  useEffect(() => {
    if (existingUser) {
      setName(existingUser.name);
      setEmail(existingUser.email);
      setIsAnonymous(existingUser.is_anonymous);
    } else {
      setName(initialName);
      setEmail(initialEmail);
      setIsAnonymous(initialAnonymous);
    }
  }, [existingUser, initialName, initialEmail, initialAnonymous]);

  const validate = (): boolean => {
    const newErrors: { name?: string; email?: string } = {};

    if (!isAnonymous && !name.trim()) {
      newErrors.name = 'Please enter your name';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    setLoading(true);
    onSubmit({
      email: email.trim(),
      name: isAnonymous ? 'Anonymous' : name.trim() || 'User',
      is_anonymous: isAnonymous,
    });
    setLoading(false);
    setTimeout(() => onClose(), 300);
  };

  const handleUpdate = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      if (onUpdate) {
        await onUpdate({
          email: email.trim(),
          name: isAnonymous ? 'Anonymous' : name.trim() || 'User',
          is_anonymous: isAnonymous,
        });
      } else {
        onSubmit({
          email: email.trim(),
          name: isAnonymous ? 'Anonymous' : name.trim() || 'User',
          is_anonymous: isAnonymous,
        });
      }
      setLoading(false);
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      setLoading(false);
    }
  };

  const handleChangeUser = () => {
    setShowChangeOption(true);
    setEmail('');
    setName('');
    setIsAnonymous(false);
    setErrors({});
  };

  const handleCancelChange = () => {
    setShowChangeOption(false);
    if (existingUser) {
      setName(existingUser.name);
      setEmail(existingUser.email);
      setIsAnonymous(existingUser.is_anonymous);
    }
  };

  const isInUpdateMode = isEditing || showChangeOption;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          p: isMobile ? 0 : 1,
          backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pt: isMobile ? 2 : 2.5,
          pb: 1,
          borderBottom: isMobile
            ? `1px solid ${
                isDark ? 'rgba(255,255,255,0.06)' : 'rgba(43,47,69,0.07)'
              }`
            : 'none',
        }}
      >
        {isInUpdateMode ? 'Update Profile' : title}
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close"
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            color: 'text.secondary',
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(43,47,69,0.05)',
            '&:hover': {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(43,47,69,0.1)',
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          px: isMobile ? 2 : 3,
          pt: isMobile ? 2 : 1,
          pb: isMobile ? 1 : 2,
        }}
      >
        {existingUser && !isEditing && !showChangeOption ? (
          <Box sx={{ mb: 3 }}>
            <Alert
              severity="success"
              sx={{ mb: 2, borderRadius: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleChangeUser}
                  startIcon={<Edit />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    minHeight: 36,
                  }}
                >
                  Change
                </Button>
              }
            >
              <Typography variant="body2">
                <strong>Welcome back!</strong>
                <br />
                {existingUser.is_anonymous
                  ? 'Anonymous'
                  : existingUser.name}{' '}
                - {existingUser.email}
              </Typography>
            </Alert>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.75rem' }}
            >
              Tap "Change" to update your name or switch between anonymous and
              named mode.
            </Typography>
          </Box>
        ) : (
          <>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3, fontSize: isMobile ? '0.8125rem' : '0.875rem' }}
            >
              {isInUpdateMode
                ? 'Update your profile details below.'
                : 'Please provide your details to continue. Your email will be used to identify you and prevent duplicate voting. Your email is never shared publicly.'}
            </Typography>

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading || (!!existingUser && !isInUpdateMode)}
              placeholder="you@example.com"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '16px',
                  minHeight: 52,
                },
              }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={isAnonymous}
                  onChange={(e) => {
                    setIsAnonymous(e.target.checked);
                    if (e.target.checked) setName('');
                  }}
                  disabled={loading}
                  sx={{
                    '& .MuiSwitch-switchBase': { padding: '10px' },
                    '& .MuiSwitch-thumb': { width: 22, height: 22 },
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>
                  Post as Anonymous
                </Typography>
              }
              sx={{ mb: 2, minHeight: 48 }}
            />

            {!isAnonymous && (
              <TextField
                fullWidth
                label="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                disabled={loading}
                placeholder="John Doe"
                sx={{
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '16px',
                    minHeight: 52,
                  },
                }}
              />
            )}

            {isAnonymous && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1, fontSize: '0.75rem' }}
              >
                Your name will not be shown. You will appear as "Anonymous".
              </Typography>
            )}

            <Alert severity="info" sx={{ mt: 1, borderRadius: 2 }}>
              <Typography
                variant="caption"
                sx={{ fontSize: '0.75rem', lineHeight: 1.6 }}
              >
                <strong>How it works:</strong> Your email identifies you
                uniquely.
                {isAnonymous
                  ? ' You will appear as "Anonymous" to other users.'
                  : ' Your name will be shown with your comments.'}
              </Typography>
            </Alert>

            {showChangeOption && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  onClick={handleCancelChange}
                  disabled={loading}
                  sx={{ textTransform: 'none', minHeight: 40 }}
                >
                  Cancel
                </Button>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: isMobile ? 2 : 3,
          pb: isMobile
            ? 'calc(16px + env(safe-area-inset-bottom))'
            : 3,
          pt: 2,
          gap: 1,
          flexDirection: { xs: 'column', sm: 'row' },
          '& > :not(style) ~ :not(style)': { ml: 0 },
        }}
      >
        {existingUser && !showChangeOption && !isEditing ? (
          <Button
            onClick={onClose}
            disabled={loading}
            fullWidth={isMobile}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 48,
              borderRadius: 2,
            }}
          >
            Close
          </Button>
        ) : isInUpdateMode ? (
          <Stack
            direction={{ xs: 'column-reverse', sm: 'row' }}
            spacing={1.5}
            sx={{ width: '100%', justifyContent: 'flex-end' }}
          >
            <Button
              onClick={onClose}
              disabled={loading}
              startIcon={<Cancel />}
              fullWidth={isMobile}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                minHeight: 48,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              variant="contained"
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={20} /> : <Save />
              }
              fullWidth={isMobile}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                minHeight: 48,
                background:
                  'linear-gradient(135deg, #5b6fd6 0%, #764ba2 100%)',
                color: '#fff',
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' },
              }}
            >
              {loading ? 'Saving...' : updateLabel}
            </Button>
          </Stack>
        ) : (
          <Stack
            direction={{ xs: 'column-reverse', sm: 'row' }}
            spacing={1.5}
            sx={{ width: '100%', justifyContent: 'flex-end' }}
          >
            <Button
              onClick={onClose}
              disabled={loading}
              fullWidth={isMobile}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                minHeight: 48,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={20} /> : null}
              fullWidth={isMobile}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                minHeight: 48,
                background:
                  'linear-gradient(135deg, #5b6fd6 0%, #764ba2 100%)',
                color: '#fff',
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' },
              }}
            >
              {loading ? 'Processing...' : submitLabel}
            </Button>
          </Stack>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CommentDialog;