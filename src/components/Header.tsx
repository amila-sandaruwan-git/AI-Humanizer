import React, { useContext, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
  Avatar,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  AutoAwesome,
  Brightness4,
  Brightness7,
  Info,
  Help,
  Menu as MenuIcon,
  Logout,
  Comment,
  Login as LoginIcon,
  Person,
  Email,
  Delete,
} from '@mui/icons-material';
import { ColorModeContext } from '../App';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface HeaderProps {
  onAboutClick?: () => void;
  onHelpClick?: () => void;
  onFeedbackClick?: () => void;
  onLoginClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onAboutClick, 
  onHelpClick, 
  onFeedbackClick,
  onLoginClick 
}) => {
  const colorMode = useContext(ColorModeContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { user, signOut, deleteAccount } = useAuth();
  const { showSuccess, showError } = useToast();

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleAboutClick = () => {
    handleMobileMenuClose();
    if (onAboutClick) onAboutClick();
  };

  const handleHelpClick = () => {
    handleMobileMenuClose();
    if (onHelpClick) onHelpClick();
  };

  const handleFeedbackClick = () => {
    handleMobileMenuClose();
    if (onFeedbackClick) onFeedbackClick();
  };

  const handleLoginClick = () => {
    handleMobileMenuClose();
    if (onLoginClick) onLoginClick();
  };

  const handleSignOut = async () => {
    handleProfileMenuClose();
    handleMobileMenuClose();
    await signOut();
    showSuccess('Signed out successfully');
  };

  const handleDeleteAccount = () => {
    handleProfileMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await deleteAccount();
      showSuccess('Account deleted successfully');
      window.location.reload();
    } catch (error) {
      console.error('Error deleting account:', error);
      showError('Failed to delete account. Please try again.');
    }
  };

  const getUserDisplayName = (): string => {
    if (!user) return 'User';
    const metadata = user.user_metadata || {};
    const fullName = metadata.full_name || metadata.name || '';
    if (fullName) return fullName;
    return user.email?.split('@')[0] || 'User';
  };

  const getUserAvatar = (): string => {
    if (!user) return '';
    const metadata = user.user_metadata || {};
    return metadata.avatar_url || metadata.picture || '';
  };

  const getUserInitials = (): string => {
    const name = getUserDisplayName();
    if (name === 'User') return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = getUserDisplayName();
  const initials = getUserInitials();
  const avatarUrl = getUserAvatar();
  const userEmail = user?.email || '';

  return (
    <>
      <AppBar 
        position="fixed"
        color="transparent" 
        elevation={0}
        sx={{
          backdropFilter: 'blur(20px)',
          backgroundColor: colorMode?.mode === 'dark' 
            ? 'rgba(18, 18, 18, 0.85)' 
            : 'rgba(255, 255, 255, 0.85)',
          borderBottom: `1px solid ${colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          boxShadow: colorMode?.mode === 'dark' 
            ? '0 4px 30px rgba(0, 0, 0, 0.3)' 
            : '0 4px 30px rgba(0, 0, 0, 0.06)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 0.5, minHeight: { xs: 64, sm: 72 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontFamily: 'Inter, sans-serif',
                    letterSpacing: '-0.02em',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  AI Humanizer
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    fontSize: '0.6rem',
                    color: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontFamily: 'Inter, sans-serif',
                    marginTop: '-4px',
                  }}
                >
                  Transform AI Text - v1.0
                </Typography>
              </Box>
            </Box>

            {!isMobile ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                <Button
                  color="inherit"
                  onClick={onAboutClick}
                  sx={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    px: 2,
                    py: 1,
                    borderRadius: '8px',
                    color: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                    '&:hover': {
                      backgroundColor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                      color: colorMode?.mode === 'dark' ? '#fff' : '#000',
                    },
                  }}
                  startIcon={<Info sx={{ fontSize: 18 }} />}
                >
                  About
                </Button>

                <Button
                  color="inherit"
                  onClick={onHelpClick}
                  sx={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    px: 2,
                    py: 1,
                    borderRadius: '8px',
                    color: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                    '&:hover': {
                      backgroundColor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                      color: colorMode?.mode === 'dark' ? '#fff' : '#000',
                    },
                  }}
                  startIcon={<Help sx={{ fontSize: 18 }} />}
                >
                  Help
                </Button>

                <Button
                  color="inherit"
                  onClick={onFeedbackClick}
                  sx={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    px: 2,
                    py: 1,
                    borderRadius: '8px',
                    color: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                    '&:hover': {
                      backgroundColor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                      color: colorMode?.mode === 'dark' ? '#fff' : '#000',
                    },
                  }}
                  startIcon={<Comment sx={{ fontSize: 18 }} />}
                >
                  Feedback
                </Button>

                <Divider orientation="vertical" flexItem sx={{ mx: 1, opacity: 0.3 }} />

                <Tooltip title={colorMode?.mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                  <IconButton
                    onClick={colorMode?.toggleColorMode}
                    sx={{
                      borderRadius: '10px',
                      width: 40,
                      height: 40,
                      backgroundColor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      '&:hover': {
                        backgroundColor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                      },
                    }}
                  >
                    {colorMode?.mode === 'dark' ? (
                      <Brightness7 sx={{ fontSize: 20, color: '#fbbf24' }} />
                    ) : (
                      <Brightness4 sx={{ fontSize: 20, color: '#6366f1' }} />
                    )}
                  </IconButton>
                </Tooltip>

                {user ? (
                  <Box>
                    <IconButton
                      onClick={handleProfileMenuOpen}
                      size="small"
                      sx={{
                        p: 0,
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: 'primary.main',
                        '&:hover': {
                          borderColor: 'primary.light',
                        },
                      }}
                    >
                      <Avatar 
                        src={avatarUrl || undefined}
                        sx={{ 
                          width: 36, 
                          height: 36, 
                          bgcolor: avatarUrl ? 'transparent' : 'primary.main',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}
                      >
                        {!avatarUrl && initials}
                      </Avatar>
                    </IconButton>
                    
                    <Menu
                      anchorEl={profileMenuAnchor}
                      open={Boolean(profileMenuAnchor)}
                      onClose={handleProfileMenuClose}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      slotProps={{
                        paper: {
                          sx: {
                            mt: 1,
                            borderRadius: '16px',
                            minWidth: 240,
                            backgroundColor: colorMode?.mode === 'dark' ? '#1e1e1e' : '#ffffff',
                            border: `1px solid ${colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                            overflow: 'visible',
                          },
                        },
                      }}
                    >
                      <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          src={avatarUrl || undefined}
                          sx={{ 
                            width: 48, 
                            height: 48, 
                            bgcolor: avatarUrl ? 'transparent' : 'primary.main',
                            fontSize: '1.25rem',
                            fontWeight: 600,
                          }}
                        >
                          {!avatarUrl && initials}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 700,
                              fontSize: '0.9375rem',
                              fontFamily: 'Inter, sans-serif',
                              color: 'text.primary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {displayName}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                              fontFamily: 'Inter, sans-serif',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <Email sx={{ fontSize: 14 }} />
                            {userEmail}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Divider sx={{ opacity: 0.3 }} />
                      
                      <MenuItem 
                        onClick={handleProfileMenuClose}
                        sx={{ 
                          py: 1.5, 
                          px: 2,
                          gap: 1.5,
                          '&:hover': {
                            backgroundColor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 0 }}>
                          <Person sx={{ fontSize: 20, color: 'text.secondary' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Profile"
                          sx={{
                            '& .MuiListItemText-primary': {
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              fontFamily: 'Inter, sans-serif',
                            }
                          }}
                        />
                      </MenuItem>
                      
                      <Divider sx={{ opacity: 0.3 }} />
                      
                      <MenuItem 
                        onClick={handleDeleteAccount}
                        sx={{ 
                          py: 1.5, 
                          px: 2,
                          gap: 1.5,
                          color: 'error.main',
                          '&:hover': {
                            backgroundColor: colorMode?.mode === 'dark' ? 'rgba(244,67,54,0.08)' : 'rgba(244,67,54,0.04)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 0 }}>
                          <Delete sx={{ fontSize: 20, color: 'error.main' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Delete Account"
                          sx={{
                            '& .MuiListItemText-primary': {
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              fontFamily: 'Inter, sans-serif',
                            }
                          }}
                        />
                      </MenuItem>
                      
                      <MenuItem 
                        onClick={handleSignOut}
                        sx={{ 
                          py: 1.5, 
                          px: 2,
                          gap: 1.5,
                          '&:hover': {
                            backgroundColor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 0 }}>
                          <Logout sx={{ fontSize: 20, color: 'text.secondary' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Log Out"
                          sx={{
                            '& .MuiListItemText-primary': {
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              fontFamily: 'Inter, sans-serif',
                            }
                          }}
                        />
                      </MenuItem>
                    </Menu>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleLoginClick}
                    startIcon={<LoginIcon />}
                    sx={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      borderRadius: '10px',
                      px: 2.5,
                      py: 1,
                      textTransform: 'none',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 24px rgba(102, 126, 234, 0.4)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    Login
                  </Button>
                )}
              </Box>
            ) : (
              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  onClick={colorMode?.toggleColorMode}
                  size="small"
                  sx={{
                    borderRadius: '10px',
                    width: 38,
                    height: 38,
                    backgroundColor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  }}
                >
                  {colorMode?.mode === 'dark' ? (
                    <Brightness7 sx={{ fontSize: 18, color: '#fbbf24' }} />
                  ) : (
                    <Brightness4 sx={{ fontSize: 18, color: '#6366f1' }} />
                  )}
                </IconButton>

                {user ? (
                  <Avatar 
                    src={avatarUrl || undefined}
                    onClick={handleProfileMenuOpen}
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: avatarUrl ? 'transparent' : 'primary.main',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: '2px solid',
                      borderColor: 'primary.main',
                    }}
                  >
                    {!avatarUrl && initials}
                  </Avatar>
                ) : (
                  <IconButton
                    onClick={handleLoginClick}
                    size="small"
                    sx={{
                      borderRadius: '10px',
                      width: 38,
                      height: 38,
                      backgroundColor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    }}
                  >
                    <LoginIcon />
                  </IconButton>
                )}

                <IconButton
                  onClick={handleMobileMenuOpen}
                  size="small"
                  sx={{
                    borderRadius: '10px',
                    width: 38,
                    height: 38,
                    backgroundColor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  }}
                >
                  <MenuIcon />
                </IconButton>

                <Menu
                  anchorEl={mobileMenuAnchor}
                  open={Boolean(mobileMenuAnchor)}
                  onClose={handleMobileMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1,
                        borderRadius: '16px',
                        minWidth: 200,
                        backgroundColor: colorMode?.mode === 'dark' ? '#1e1e1e' : '#ffffff',
                        border: `1px solid ${colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                      },
                    },
                  }}
                >
                  <MenuItem onClick={handleAboutClick} sx={{ py: 1.5, px: 2 }}>
                    <Info sx={{ mr: 1.5, fontSize: 20 }} />
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>About</Typography>
                  </MenuItem>
                  <MenuItem onClick={handleHelpClick} sx={{ py: 1.5, px: 2 }}>
                    <Help sx={{ mr: 1.5, fontSize: 20 }} />
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Help</Typography>
                  </MenuItem>
                  <MenuItem onClick={handleFeedbackClick} sx={{ py: 1.5, px: 2 }}>
                    <Comment sx={{ mr: 1.5, fontSize: 20 }} />
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Feedback</Typography>
                  </MenuItem>
                  
                  <Divider sx={{ opacity: 0.3 }} />
                  
                  {user ? (
                    <>
                      <MenuItem sx={{ py: 1.5, px: 2 }}>
                        <Avatar 
                          src={avatarUrl || undefined}
                          sx={{ 
                            width: 28, 
                            height: 28, 
                            bgcolor: avatarUrl ? 'transparent' : 'primary.main',
                            fontSize: '0.75rem',
                            mr: 1.5,
                            fontWeight: 600,
                          }}
                        >
                          {!avatarUrl && initials}
                        </Avatar>
                        <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {displayName}
                        </Typography>
                      </MenuItem>
                      <MenuItem onClick={handleSignOut} sx={{ py: 1.5, px: 2 }}>
                        <Logout sx={{ mr: 1.5, fontSize: 20 }} />
                        <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Log Out</Typography>
                      </MenuItem>
                    </>
                  ) : (
                    <MenuItem onClick={handleLoginClick} sx={{ py: 1.5, px: 2 }}>
                      <LoginIcon sx={{ mr: 1.5, fontSize: 20 }} />
                      <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Login</Typography>
                    </MenuItem>
                  )}
                </Menu>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <Box sx={{ height: { xs: 64, sm: 72 } }} />

      {/* Delete Account Confirmation Dialog - FIXED */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 2,
            backgroundColor: colorMode?.mode === 'dark' ? '#1e1e1e' : '#ffffff',
            border: colorMode?.mode === 'dark' ? '1px solid rgba(255,255,255,0.12)' : 'none',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', color: 'error.main' }}>
          Delete Account
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary', fontSize: '0.9375rem' }}>
            Are you sure you want to delete your account? This action cannot be undone.
            All your data including comments will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ gap: 1, px: 2, pb: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 600,
              color: 'text.secondary',
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Header;