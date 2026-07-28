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
  existingUser?: { email: string; name: string; is_anonymous: boolean } | null;
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
    setTimeout(() => {
      onClose();
    }, 300);
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
        // Fallback: use onSubmit if onUpdate is not provided
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
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isInUpdateMode ? 'Update Profile' : title}
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {existingUser && !isEditing && !showChangeOption ? (
          <Box sx={{ mb: 3 }}>
            <Alert 
              severity="success" 
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={handleChangeUser} startIcon={<Edit />}>
                  Change
                </Button>
              }
            >
              <Typography variant="body2">
                <strong>Welcome back!</strong><br />
                {existingUser.is_anonymous ? 'Anonymous' : existingUser.name} • {existingUser.email}
              </Typography>
            </Alert>
            <Typography variant="caption" color="text.secondary">
              Click "Change" to update your name or switch between anonymous and named mode.
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={isAnonymous}
                  onChange={(e) => {
                    setIsAnonymous(e.target.checked);
                    if (e.target.checked) {
                      setName('');
                    }
                  }}
                  disabled={loading}
                />
              }
              label="Post as Anonymous"
              sx={{ mb: 2 }}
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
                sx={{ mb: 1 }}
              />
            )}

            {isAnonymous && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Your name will not be shown. You will appear as "Anonymous".
              </Typography>
            )}

            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="caption">
                <strong>How it works:</strong> Your email identifies you uniquely. 
                {isAnonymous 
                  ? ' You will appear as "Anonymous" to other users.'
                  : ' Your name will be shown with your comments.'}
                <br />
              </Typography>
            </Alert>

            {showChangeOption && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button size="small" onClick={handleCancelChange} disabled={loading}>
                  Cancel
                </Button>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        {existingUser && !showChangeOption && !isEditing ? (
          <Button onClick={onClose} disabled={loading}>
            Close
          </Button>
        ) : isInUpdateMode ? (
          <Stack direction="row" spacing={1.5} sx={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button 
              onClick={onClose} 
              disabled={loading}
              startIcon={<Cancel />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                py: 1,
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
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                boxShadow: '0 4px 24px rgba(102, 126, 234, 0.35)',
                '&:hover': {
                  boxShadow: '0 6px 32px rgba(102, 126, 234, 0.5)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              {loading ? 'Saving...' : updateLabel}
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1.5} sx={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button 
              onClick={onClose} 
              disabled={loading}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                py: 1,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={20} /> : null}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                boxShadow: '0 4px 24px rgba(102, 126, 234, 0.35)',
                '&:hover': {
                  boxShadow: '0 6px 32px rgba(102, 126, 234, 0.5)',
                  transform: 'translateY(-1px)',
                },
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