import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Stack,
  Tooltip,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Menu,
  MenuItem,
  Collapse,
  IconButton,
  Fade,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Reply,
  MoreVert,
  Edit,
  Delete,
  Send,
  Person,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { commentService } from '../../services/commentService';
import { supabase } from '../../services/supabaseClient';
import { Comment } from '../../types/comment';
import CommentDialog from '../CommentDialog';
import { useToast } from '../../context/ToastContext';

interface CommentSectionProps {
  onCommentAdded?: () => void;
}

// Single Comment Component
const SingleComment: React.FC<{
  comment: Comment;
  onDelete: (commentId: string) => void;
  onAddReply: (content: string, parentId: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  depth?: number;
  userEmail: string | null;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  editingComment: string | null;
  setEditingComment: (id: string | null) => void;
  onRequireUser: () => void;
  onEditUser: () => void;
}> = ({
  comment,
  onDelete,
  onAddReply,
  onEdit,
  depth = 0,
  userEmail,
  replyingTo,
  setReplyingTo,
  editingComment,
  setEditingComment,
  onRequireUser,
  onEditUser,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const { showSuccess, showError } = useToast();

  const isOwner = userEmail === comment.user_id;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isReply = depth > 0;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
    handleMenuClose();
  };

  const handleDelete = async () => {
    handleMenuClose();
    onDelete(comment.id);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      showError('Comment cannot be empty');
      return;
    }
    try {
      await onEdit(comment.id, editContent);
      setEditingComment(null);
      showSuccess('Comment updated!');
    } catch (error: any) {
      showError(error.message || 'Failed to update comment');
    }
  };

  const handleReplyClick = () => {
    if (!userEmail) {
      onRequireUser();
      return;
    }
    setShowReplyBox(!showReplyBox);
    if (replyingTo !== comment.id) {
      setReplyingTo(comment.id);
    }
  };

  const handleCancelReply = () => {
    setShowReplyBox(false);
    setReplyContent('');
    setReplyingTo(null);
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      showError('Reply cannot be empty');
      return;
    }

    setIsSubmittingReply(true);
    try {
      await onAddReply(replyContent.trim(), comment.id);
      setReplyContent('');
      setShowReplyBox(false);
      setReplyingTo(null);
      showSuccess('Reply added!');
    } catch (error) {
      showError('Failed to add reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const getUserInitials = (name: string): string => {
    if (name === 'Anonymous') return 'A';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (userId: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFD93D', '#DDA0DD', '#FF8A5C', '#A29BFE'];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const displayName = comment.is_anonymous ? 'Anonymous' : comment.user_name;
  const initials = getUserInitials(displayName);
  const avatarColor = getAvatarColor(comment.user_id);
  const avatarSize = isMobile ? 32 : 40;

  return (
    <Box 
      sx={{ 
        ml: isReply ? (isMobile ? 2 : 3) : 0,
        pl: isReply ? (isMobile ? 1.5 : 2) : 0,
        borderLeft: isReply ? `2px solid ${avatarColor}30` : 'none',
        position: 'relative',
        transition: 'all 0.2s ease',
        pt: 1,
        pb: 0.5,
      }}
    >
      <Fade in={true} timeout={200}>
        <Box
          sx={{
            p: isMobile ? 1.5 : 2,
            mb: 0.5,
            borderRadius: 2,
            backgroundColor: 'transparent',
            transition: 'all 0.2s ease',
            border: 'none',
            '&:hover': {
              backgroundColor: isReply ? 'rgba(0,0,0,0.02)' : 'transparent',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? 1.5 : 2 }}>
            <Avatar 
              sx={{ 
                width: avatarSize, 
                height: avatarSize,
                bgcolor: avatarColor,
                fontSize: isMobile ? '0.75rem' : '1rem',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '2px solid',
                borderColor: 'background.paper',
              }}
            >
              {initials}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 700, 
                  fontSize: isMobile ? '0.875rem' : '0.9375rem',
                  color: 'text.primary',
                }}>
                  {displayName}
                </Typography>
                {comment.is_anonymous && (
                  <Chip 
                    label="Anonymous" 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      height: isMobile ? 16 : 20, 
                      fontSize: isMobile ? '0.5rem' : '0.6rem',
                      fontWeight: 600,
                      '& .MuiChip-label': { px: 0.75 },
                    }} 
                  />
                )}
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary', 
                  fontSize: isMobile ? '0.65rem' : '0.75rem',
                }}>
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </Typography>
                {isOwner && (
                  <Chip 
                    label="You" 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ 
                      height: isMobile ? 16 : 20, 
                      fontSize: isMobile ? '0.5rem' : '0.6rem',
                      fontWeight: 600,
                      '& .MuiChip-label': { px: 0.75 },
                    }} 
                  />
                )}
              </Box>

              {editingComment === comment.id ? (
                <Box sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={isMobile ? 2 : 3}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    variant="outlined"
                    size="small"
                    autoFocus
                  />
                  <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                    <Button variant="contained" size="small" onClick={handleSaveEdit} startIcon={<Send />}>
                      Save
                    </Button>
                    <Button variant="outlined" size="small" onClick={() => setEditingComment(null)}>
                      Cancel
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ 
                  fontSize: '0.9375rem', 
                  lineHeight: 1.7,
                  color: 'text.primary',
                  whiteSpace: 'pre-wrap', 
                  wordWrap: 'break-word',
                  mt: 0.5,
                }}>
                  {comment.content}
                </Typography>
              )}

              {!editingComment && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.25 : 0.5, mt: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    startIcon={<Reply sx={{ fontSize: isMobile ? 16 : 18 }} />}
                    onClick={handleReplyClick}
                    sx={{ 
                      color: 'text.secondary', 
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      borderRadius: 2,
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.04)',
                      },
                    }}
                  >
                    Reply
                  </Button>

                  {hasReplies && (
                    <Button
                      size="small"
                      onClick={toggleReplies}
                      sx={{ 
                        color: 'text.secondary', 
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      {showReplies ? `Hide replies (${comment.replies?.length})` : `Show replies (${comment.replies?.length})`}
                    </Button>
                  )}

                  {isOwner && (
                    <>
                      <IconButton size="small" onClick={handleMenuOpen} sx={{ p: 0.5 }}>
                        <MoreVert sx={{ fontSize: isMobile ? 16 : 18 }} />
                      </IconButton>
                      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                        <MenuItem onClick={handleEdit}>
                          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
                        </MenuItem>
                        <MenuItem onClick={onEditUser}>
                          <Person fontSize="small" sx={{ mr: 1 }} /> Edit Profile
                        </MenuItem>
                        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                          <Delete fontSize="small" color="error" sx={{ mr: 1 }} /> Delete
                        </MenuItem>
                      </Menu>
                    </>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          <Collapse in={showReplyBox && !!userEmail} timeout="auto">
            <Box sx={{ mt: 1.5, pl: isMobile ? 4 : 6 }}>
              <Divider sx={{ mb: 1.5 }} />
              <Box sx={{ display: 'flex', gap: isMobile ? 1 : 2 }}>
                <Avatar sx={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, bgcolor: '#667eea' }}>
                  <Person fontSize="small" />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={1}
                    placeholder={`Reply to ${displayName}...`}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    variant="standard"
                    size="small"
                    autoFocus
                    disabled={isSubmittingReply}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitReply();
                      }
                    }}
                    sx={{
                      '& .MuiInput-root': {
                        backgroundColor: 'transparent',
                        fontSize: isMobile ? '0.875rem' : '0.9375rem',
                        padding: '4px 0',
                        '&:before': {
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                        },
                        '&:hover:not(.Mui-disabled):before': {
                          borderBottom: '2px solid',
                          borderColor: 'primary.main',
                        },
                        '&:after': {
                          borderBottom: '2px solid',
                          borderColor: 'primary.main',
                        },
                      },
                      '& .MuiInput-input': {
                        padding: '8px 0',
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                    <Button
                      size="small"
                      variant="text"
                      onClick={handleCancelReply}
                      disabled={isSubmittingReply}
                      sx={{ 
                        borderRadius: 2, 
                        textTransform: 'none',
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        minWidth: 'auto',
                        px: 1,
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim() || isSubmittingReply}
                      startIcon={isSubmittingReply ? <CircularProgress size={14} /> : <Send sx={{ fontSize: 14 }} />}
                      sx={{ 
                        borderRadius: 2, 
                        textTransform: 'none',
                        color: 'primary.main',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        minWidth: 'auto',
                        px: 1,
                      }}
                    >
                      Reply
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Collapse>

          {hasReplies && showReplies && (
            <Box sx={{ ml: 0, mt: 0.25 }}>
              {comment.replies?.map((reply) => (
                <SingleComment
                  key={reply.id}
                  comment={reply}
                  onDelete={onDelete}
                  onAddReply={onAddReply}
                  onEdit={onEdit}
                  depth={depth + 1}
                  userEmail={userEmail}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  editingComment={editingComment}
                  setEditingComment={setEditingComment}
                  onRequireUser={onRequireUser}
                  onEditUser={onEditUser}
                />
              ))}
            </Box>
          )}
        </Box>
      </Fade>
    </Box>
  );
};

export const CommentSection: React.FC<CommentSectionProps> = ({ onCommentAdded }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSuccess, showError } = useToast();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('commentUserEmail');
  });
  const [userName, setUserName] = useState<string | null>(() => {
    return localStorage.getItem('commentUserName');
  });
  const [isAnonymous, setIsAnonymous] = useState<boolean>(() => {
    return localStorage.getItem('commentIsAnonymous') === 'true';
  });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'initial' | 'edit'>('initial');
  const [pendingAction, setPendingAction] = useState<'comment' | 'reply' | null>(null);
  const [existingUser, setExistingUser] = useState<{ email: string; name: string; is_anonymous: boolean } | null>(null);
  const isMounted = useRef(true);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await commentService.getComments();
      
      if (isMounted.current) {
        setComments(data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchComments();

    const channel = supabase
      .channel('comments-global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        async () => {
          console.log('🔄 Comment changed');
          await fetchComments();
          if (onCommentAdded) onCommentAdded();
        }
      )
      .subscribe((status) => {
        console.log('📡 Global subscription status:', status);
      });

    return () => {
      isMounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [fetchComments, onCommentAdded]);

  useEffect(() => {
    const checkUser = async () => {
      if (userEmail) {
        const user = await commentService.getUserByEmail(userEmail);
        if (user) {
          setExistingUser({
            email: user.email,
            name: user.name,
            is_anonymous: user.is_anonymous,
          });
          setIsAnonymous(user.is_anonymous);
          if (!user.is_anonymous) {
            setUserName(user.name);
          }
        } else {
          setExistingUser(null);
        }
      }
    };
    checkUser();
  }, [userEmail]);

  // ============ FIXED: Handle User Submit (Create or Update) ============
  const handleUserSubmit = async (user: { email: string; name: string; is_anonymous: boolean }) => {
    // Check if this is an update (user already exists)
    const isUpdate = existingUser && existingUser.email === user.email;
    
    if (isUpdate) {
      // Update existing user in database
      try {
        await commentService.updateUserProfile(user.email, user.name, user.is_anonymous);
        // Update local state
        setExistingUser({
          email: user.email,
          name: user.name,
          is_anonymous: user.is_anonymous,
        });
        setUserEmail(user.email);
        setUserName(user.name);
        setIsAnonymous(user.is_anonymous);
        localStorage.setItem('commentUserEmail', user.email);
        localStorage.setItem('commentUserName', user.name);
        localStorage.setItem('commentIsAnonymous', String(user.is_anonymous));
        showSuccess('Profile updated successfully!');
      } catch (error) {
        console.error('Error updating profile:', error);
        showError('Failed to update profile');
        return;
      }
    } else {
      // New user - save to localStorage and state
      setUserEmail(user.email);
      setUserName(user.name);
      setIsAnonymous(user.is_anonymous);
      localStorage.setItem('commentUserEmail', user.email);
      localStorage.setItem('commentUserName', user.name);
      localStorage.setItem('commentIsAnonymous', String(user.is_anonymous));
      setExistingUser({
        email: user.email,
        name: user.name,
        is_anonymous: user.is_anonymous,
      });
    }

    setDialogOpen(false);

    if (pendingAction === 'comment') {
      await handleAddComment();
    }
    setPendingAction(null);
  };

  // ============ FIXED: Handle Update User ============
  const handleUpdateUser = async (user: { email: string; name: string; is_anonymous: boolean }) => {
    try {
      await commentService.updateUserProfile(user.email, user.name, user.is_anonymous);
      setExistingUser({
        email: user.email,
        name: user.name,
        is_anonymous: user.is_anonymous,
      });
      setUserEmail(user.email);
      setUserName(user.name);
      setIsAnonymous(user.is_anonymous);
      localStorage.setItem('commentUserEmail', user.email);
      localStorage.setItem('commentUserName', user.name);
      localStorage.setItem('commentIsAnonymous', String(user.is_anonymous));
      showSuccess('Profile updated successfully!');
      setDialogOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile');
    }
  };

  const handleAddComment = async () => {
    if (!userEmail) {
      setPendingAction('comment');
      setDialogMode('initial');
      setDialogOpen(true);
      return;
    }

    const trimmedComment = newComment.trim();
    if (!trimmedComment) {
      showError('Comment cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      await commentService.addComment(
        trimmedComment,
        {
          email: userEmail,
          name: userName || 'User',
          is_anonymous: isAnonymous,
        },
        null
      );
      
      setNewComment('');
      showSuccess('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      showError('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddReply = async (content: string, parentId: string) => {
    if (!userEmail) {
      setPendingAction('reply');
      setDialogMode('initial');
      setDialogOpen(true);
      throw new Error('User not authenticated');
    }

    try {
      await commentService.addComment(
        content,
        {
          email: userEmail,
          name: userName || 'User',
          is_anonymous: isAnonymous,
        },
        parentId
      );
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    if (!userEmail) {
      showError('You must be logged in to edit');
      return;
    }
    try {
      console.log(`✏️ Attempting to edit comment ${commentId}`);
      await commentService.updateComment(commentId, content, userEmail);
      console.log(`✅ Comment ${commentId} edited successfully`);
      
      setComments(prev => 
        prev.map(c => {
          if (c.id === commentId) {
            return { ...c, content };
          }
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map(r => 
                r.id === commentId ? { ...r, content } : r
              )
            };
          }
          return c;
        })
      );
      showSuccess('Comment updated!');
    } catch (error: any) {
      console.error('Error editing comment:', error);
      showError(error.message || 'Failed to edit comment');
      throw error;
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    if (!userEmail) {
      showError('You must be logged in to delete');
      return;
    }
    try {
      console.log(`🗑️ Attempting to delete comment ${commentId}`);
      await commentService.deleteComment(commentId, userEmail);
      console.log(`✅ Comment ${commentId} deleted successfully`);
      
      setComments(prev => 
        prev
          .filter(c => c.id !== commentId)
          .map(c => ({
            ...c,
            replies: c.replies?.filter(r => r.id !== commentId) || []
          }))
      );
      showSuccess('Comment deleted!');
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      showError(error.message || 'Failed to delete comment');
    }
  };

  const handleEditUser = () => {
    setDialogMode('edit');
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ p: isMobile ? 2 : 3, mt: isMobile ? 2 : 3, borderRadius: isMobile ? 2 : 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: isMobile ? 2 : 3, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            💬 Discussion
            <Chip 
              label={comments.length} 
              size="small" 
              sx={{ 
                fontWeight: 600,
                height: isMobile ? 20 : 24,
                fontSize: isMobile ? '0.65rem' : '0.75rem',
                backgroundColor: 'primary.main',
                color: '#fff',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          </Typography>
          {userEmail && (
            <Button
              size="small"
              startIcon={<Person />}
              onClick={handleEditUser}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              {isAnonymous ? 'Anonymous' : userName}
            </Button>
          )}
        </Box>

        {/* Comment Input */}
        <Box sx={{ 
          mb: isMobile ? 2 : 3, 
          p: isMobile ? 1.5 : 2,
          borderRadius: 2,
          display: 'flex',
          gap: isMobile ? 1.5 : 2,
          alignItems: 'flex-start',
          transition: 'all 0.2s ease',
        }}>
          <Avatar sx={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, bgcolor: '#667eea' }}>
            <Person />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              multiline
              rows={1}
              placeholder={userEmail ? "What are your thoughts?" : "Click here to add your name and email to comment"}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isSubmitting}
              variant="standard"
              size="small"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              onClick={() => {
                if (!userEmail) {
                  setPendingAction('comment');
                  setDialogMode('initial');
                  setDialogOpen(true);
                }
              }}
              sx={{
                '& .MuiInput-root': {
                  backgroundColor: 'transparent',
                  fontSize: isMobile ? '0.875rem' : '0.9375rem',
                  padding: '4px 0',
                  '&:before': {
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  },
                  '&:hover:not(.Mui-disabled):before': {
                    borderBottom: '2px solid',
                    borderColor: 'primary.main',
                  },
                  '&:after': {
                    borderBottom: '2px solid',
                    borderColor: 'primary.main',
                  },
                },
                '& .MuiInput-input': {
                  padding: isMobile ? '6px 0' : '8px 0',
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              {userEmail ? (
                <Typography variant="caption" color="text.secondary">
                  Posting as: {isAnonymous ? 'Anonymous' : userName || 'User'}
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Click the text box to add your details
                </Typography>
              )}
              <Button
                variant="text"
                size="small"
                onClick={handleAddComment}
                disabled={isSubmitting || !newComment.trim() || !userEmail}
                startIcon={isSubmitting ? <CircularProgress size={16} /> : <Send sx={{ fontSize: 16 }} />}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none', 
                  fontWeight: 600,
                  color: 'primary.main',
                  px: 1.5,
                  py: 0.5,
                  minWidth: 'auto',
                  fontSize: '0.75rem',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  },
                }}
              >
                Post
              </Button>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: isMobile ? 1.5 : 2 }} />

        {comments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: isMobile ? 3 : 4, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No comments yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          comments.map((comment) => (
            <SingleComment
              key={comment.id}
              comment={comment}
              onDelete={handleDeleteComment}
              onAddReply={handleAddReply}
              onEdit={handleEditComment}
              depth={0}
              userEmail={userEmail}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              editingComment={editingComment}
              setEditingComment={setEditingComment}
              onRequireUser={() => {
                setPendingAction(null);
                setDialogMode('initial');
                setDialogOpen(true);
              }}
              onEditUser={handleEditUser}
            />
          ))
        )}
      </Box>

      {/* User Dialog - Updated with onUpdate prop */}
      <CommentDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setPendingAction(null);
        }}
        onSubmit={handleUserSubmit}
        onUpdate={handleUpdateUser}
        title={dialogMode === 'edit' ? 'Edit Your Profile' : 'Join the Conversation'}
        submitLabel={dialogMode === 'edit' ? 'Update' : 'Continue'}
        updateLabel="Save Changes"
        existingUser={dialogMode === 'edit' ? existingUser : null}
        isEditing={dialogMode === 'edit'}
      />
    </>
  );
};