import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  TextField,
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
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface CommentSectionProps {
  onCommentAdded?: () => void;
}

// Custom Tooltip component for editor buttons
const EditorTooltip: React.FC<{
  title: string;
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ title, children, placement = 'top' }) => {
  return (
    <Tooltip 
      title={title} 
      placement={placement}
      arrow
      enterDelay={300}
      leaveDelay={100}
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#3d3d3d' : '#333',
            color: '#fff',
            fontSize: '0.7rem',
            padding: '6px 12px',
            borderRadius: '6px',
            maxWidth: '200px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
        arrow: {
          sx: {
            color: (theme) => theme.palette.mode === 'dark' ? '#3d3d3d' : '#333',
          },
        },
      }}
    >
      {children}
    </Tooltip>
  );
};

// Quill modules with custom tooltips
const getQuillModules = (isReply: boolean) => ({
  toolbar: {
    container: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
    handlers: {
      // Custom handlers if needed
    }
  },
});

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'blockquote', 'code-block',
  'list', 'bullet',
  'link',
];

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
  const isDark = theme.palette.mode === 'dark';
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isReplyFocused, setIsReplyFocused] = useState(false);
  const { showSuccess, showError } = useToast();

  const isOwner = userEmail === comment.user_id;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isReply = depth > 0;

  // Memoize Quill modules for performance
  const quillModulesReply = useMemo(() => getQuillModules(true), []);

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
    if (!editContent.trim() || editContent === '<p><br></p>') {
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
    setIsReplyFocused(false);
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || replyContent === '<p><br></p>') {
      showError('Reply cannot be empty');
      return;
    }

    setIsSubmittingReply(true);
    try {
      await onAddReply(replyContent.trim(), comment.id);
      setReplyContent('');
      setShowReplyBox(false);
      setReplyingTo(null);
      setIsReplyFocused(false);
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

  // Quill styles - NO BORDERS, smooth animation
  const getQuillStyles = (isReply: boolean, isFocused: boolean) => ({
    minHeight: isReply ? '100px' : '150px',
    maxHeight: isReply ? '300px' : '500px',
    height: 'auto',
    marginBottom: isFocused ? '55px' : '10px',
    backgroundColor: 'transparent',
    color: isDark ? '#e0e0e0' : '#333333',
    border: 'none',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    '& .ql-toolbar': {
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '8px 8px 0 0',
      borderBottom: isFocused ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}` : 'none',
      opacity: isFocused ? 1 : 0,
      maxHeight: isFocused ? '60px' : '0px',
      padding: isFocused ? '8px 4px' : '0px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      transform: isFocused ? 'translateY(0)' : 'translateY(-10px)',
      pointerEvents: isFocused ? 'auto' : 'none',
      // Custom tooltip styles for Quill toolbar buttons
      '& .ql-bold .ql-stroke': { strokeWidth: '2px' },
      '& .ql-italic .ql-stroke': { strokeWidth: '2px' },
      '& .ql-underline .ql-stroke': { strokeWidth: '2px' },
      '& .ql-strike .ql-stroke': { strokeWidth: '2px' },
    },
    '& .ql-container': {
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: isFocused ? '0 0 8px 8px' : '8px',
      fontSize: '0.9375rem',
      fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
      minHeight: isReply ? '80px' : '120px',
      maxHeight: isReply ? '250px' : '450px',
      overflowY: 'auto',
      cursor: 'text',
      transition: 'all 0.3s ease',
    },
    '& .ql-editor': {
      color: isDark ? '#e0e0e0' : '#333333',
      minHeight: isReply ? '80px' : '120px',
      maxHeight: isReply ? '250px' : '450px',
      overflowY: 'auto',
      padding: isFocused ? '12px 16px' : '12px 16px',
      fontSize: '0.9375rem',
      lineHeight: '1.7',
      '&:focus': {
        outline: 'none',
      },
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        borderRadius: '3px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
        borderRadius: '3px',
        '&:hover': {
          background: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
        },
      },
    },
    '& .ql-editor.ql-blank::before': {
      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
      fontStyle: 'italic',
    },
    '& .ql-stroke': {
      stroke: isDark ? '#e0e0e0' : '#333333',
    },
    '& .ql-fill': {
      fill: isDark ? '#e0e0e0' : '#333333',
    },
    '& .ql-picker-label': {
      color: isDark ? '#e0e0e0' : '#333333',
    },
    '& .ql-picker-options': {
      backgroundColor: isDark ? '#2d2d2d' : '#ffffff',
      color: isDark ? '#e0e0e0' : '#333333',
      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
    },
    '& .ql-toolbar .ql-active': {
      color: isDark ? '#90caf9' : '#1976d2',
    },
    '& .ql-toolbar button:hover': {
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      borderRadius: '4px',
    },
    '& .ql-toolbar button.ql-active': {
      backgroundColor: isDark ? 'rgba(144, 202, 249, 0.15)' : 'rgba(25, 118, 210, 0.08)',
      borderRadius: '4px',
    },
  });

  return (
    <Box 
      sx={{ 
        ml: isReply ? (isMobile ? 2 : 3) : 0,
        pl: isReply ? (isMobile ? 1.5 : 2) : 0,
        borderLeft: isReply ? `2px solid ${avatarColor}15` : 'none',
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
                border: 'none',
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
                      border: 'none',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
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
                      border: 'none',
                    }} 
                  />
                )}
              </Box>

              {editingComment === comment.id ? (
                <Box sx={{ mt: 1 }}>
                  <Box sx={getQuillStyles(true, true)}>
                    <ReactQuill
                      theme="snow"
                      value={editContent}
                      onChange={setEditContent}
                      modules={quillModulesReply}
                      formats={quillFormats}
                      placeholder="Edit your comment..."
                    />
                  </Box>
                  <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                    <Button variant="contained" size="small" onClick={handleSaveEdit} startIcon={<Send />}>
                      Save
                    </Button>
                    <Button variant="outlined" size="small" onClick={() => setEditingComment(null)}>
                      Cancel
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box
                  className="ql-editor"
                  sx={{
                    fontSize: '0.9375rem',
                    lineHeight: 1.7,
                    color: 'text.primary',
                    wordWrap: 'break-word',
                    mt: 0.5,
                    padding: 0,
                    maxHeight: '400px',
                    overflowY: 'auto',
                    border: 'none',
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                      borderRadius: '3px',
                      '&:hover': {
                        background: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
                      },
                    },
                    '& p': { margin: '0 0 4px 0' },
                    '& ul, & ol': { paddingLeft: '24px', margin: '4px 0' },
                    '& blockquote': {
                      borderLeft: `4px solid ${isDark ? '#90caf9' : '#667eea'}`,
                      paddingLeft: '12px',
                      margin: '8px 0',
                      color: isDark ? '#b0b0c8' : '#666',
                      fontStyle: 'italic',
                    },
                    '& a': {
                      color: isDark ? '#90caf9' : '#667eea',
                      textDecoration: 'underline',
                    },
                    '& strong': { fontWeight: 700 },
                    '& em': { fontStyle: 'italic' },
                    '& u': { textDecoration: 'underline' },
                    '& strike': { textDecoration: 'line-through' },
                    '& code': {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f5',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '0.85em',
                    },
                  }}
                  dangerouslySetInnerHTML={{ __html: comment.content }}
                />
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
                      border: 'none',
                      '&:hover': {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
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
                        border: 'none',
                        '&:hover': {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      {showReplies ? `Hide replies (${comment.replies?.length})` : `Show replies (${comment.replies?.length})`}
                    </Button>
                  )}

                  {isOwner && (
                    <>
                      <IconButton size="small" onClick={handleMenuOpen} sx={{ p: 0.5, border: 'none' }}>
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
              <Divider sx={{ mb: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
              <Box sx={{ display: 'flex', gap: isMobile ? 1 : 2 }}>
                <Avatar sx={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, bgcolor: '#667eea', border: 'none' }}>
                  <Person fontSize="small" />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={getQuillStyles(true, isReplyFocused)}>
                    <ReactQuill
                      theme="snow"
                      value={replyContent}
                      onChange={setReplyContent}
                      modules={quillModulesReply}
                      formats={quillFormats}
                      placeholder={`Reply to ${displayName}...`}
                      onFocus={() => setIsReplyFocused(true)}
                      onBlur={() => {
                        if (!replyContent || replyContent === '<p><br></p>') {
                          setIsReplyFocused(false);
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
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
                        border: 'none',
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim() || replyContent === '<p><br></p>' || isSubmittingReply}
                      startIcon={isSubmittingReply ? <CircularProgress size={14} color="inherit" /> : <Send sx={{ fontSize: 14 }} />}
                      sx={{ 
                        borderRadius: 2, 
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        minWidth: 'auto',
                        px: 2.5,
                        py: 0.75,
                        background: isDark 
                          ? 'linear-gradient(135deg, rgba(144, 202, 249, 0.2), rgba(144, 202, 249, 0.05))'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: isDark ? '#90caf9' : '#fff',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(144, 202, 249, 0.2)' : 'transparent',
                        boxShadow: isDark 
                          ? 'none'
                          : '0 4px 20px rgba(102, 126, 234, 0.3)',
                        '&:hover': {
                          background: isDark 
                            ? 'linear-gradient(135deg, rgba(144, 202, 249, 0.3), rgba(144, 202, 249, 0.1))'
                            : 'linear-gradient(135deg, #5a6fd6 0%, #6a3f9a 100%)',
                          boxShadow: isDark 
                            ? '0 0 20px rgba(144, 202, 249, 0.1)'
                            : '0 6px 30px rgba(102, 126, 234, 0.4)',
                          transform: 'translateY(-1px)',
                        },
                        '&:active': {
                          transform: 'scale(0.97)',
                        },
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
  const isDark = theme.palette.mode === 'dark';
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
  const [isMainFocused, setIsMainFocused] = useState(false);
  const isMounted = useRef(true);

  // Memoize Quill modules for performance
  const quillModulesMain = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link'],
        ['clean']
      ],
    }
  }), []);

  // Main Quill styles - NO BORDERS, smooth animation
  const getMainQuillStyles = (isFocused: boolean) => ({
    minHeight: '150px',
    maxHeight: '500px',
    height: 'auto',
    marginBottom: isFocused ? '55px' : '10px',
    backgroundColor: 'transparent',
    color: isDark ? '#e0e0e0' : '#333333',
    border: 'none',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    '& .ql-toolbar': {
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '8px 8px 0 0',
      borderBottom: isFocused ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}` : 'none',
      opacity: isFocused ? 1 : 0,
      maxHeight: isFocused ? '60px' : '0px',
      padding: isFocused ? '8px 4px' : '0px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      transform: isFocused ? 'translateY(0)' : 'translateY(-10px)',
      pointerEvents: isFocused ? 'auto' : 'none',
    },
    '& .ql-container': {
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: isFocused ? '0 0 8px 8px' : '8px',
      fontSize: '0.9375rem',
      fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
      minHeight: '120px',
      maxHeight: '450px',
      overflowY: 'auto',
      cursor: 'text',
      transition: 'all 0.3s ease',
    },
    '& .ql-editor': {
      color: isDark ? '#e0e0e0' : '#333333',
      minHeight: '120px',
      maxHeight: '450px',
      overflowY: 'auto',
      padding: '12px 16px',
      fontSize: '0.9375rem',
      lineHeight: '1.7',
      '&:focus': {
        outline: 'none',
      },
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        borderRadius: '3px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
        borderRadius: '3px',
        '&:hover': {
          background: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
        },
      },
    },
    '& .ql-editor.ql-blank::before': {
      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
      fontStyle: 'italic',
    },
    '& .ql-stroke': {
      stroke: isDark ? '#e0e0e0' : '#333333',
    },
    '& .ql-fill': {
      fill: isDark ? '#e0e0e0' : '#333333',
    },
    '& .ql-picker-label': {
      color: isDark ? '#e0e0e0' : '#333333',
    },
    '& .ql-picker-options': {
      backgroundColor: isDark ? '#2d2d2d' : '#ffffff',
      color: isDark ? '#e0e0e0' : '#333333',
      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
    },
    '& .ql-toolbar .ql-active': {
      color: isDark ? '#90caf9' : '#1976d2',
    },
    '& .ql-toolbar button:hover': {
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      borderRadius: '4px',
    },
    '& .ql-toolbar button.ql-active': {
      backgroundColor: isDark ? 'rgba(144, 202, 249, 0.15)' : 'rgba(25, 118, 210, 0.08)',
      borderRadius: '4px',
    },
  });

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

  const handleUserSubmit = async (user: { email: string; name: string; is_anonymous: boolean }) => {
    const isUpdate = existingUser && existingUser.email === user.email;
    
    if (isUpdate) {
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
      } catch (error) {
        console.error('Error updating profile:', error);
        showError('Failed to update profile');
        return;
      }
    } else {
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
    if (!trimmedComment || trimmedComment === '<p><br></p>') {
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
      setIsMainFocused(false);
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
      <Box sx={{ p: isMobile ? 2 : 3, mt: isMobile ? 2 : 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: isMobile ? 2 : 3, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: 'text.primary',
          }}>
            💬 Discussion
            <Chip 
              label={comments.length} 
              size="small" 
              sx={{ 
                fontWeight: 600,
                height: isMobile ? 20 : 24,
                fontSize: isMobile ? '0.65rem' : '0.75rem',
                backgroundColor: isDark ? 'rgba(144, 202, 249, 0.15)' : 'primary.main',
                color: isDark ? '#90caf9' : '#fff',
                border: 'none',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          </Typography>
          {userEmail && (
            <Button
              size="small"
              startIcon={<Person />}
              onClick={handleEditUser}
              sx={{ 
                textTransform: 'none', 
                fontSize: '0.75rem',
                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                border: 'none',
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                },
              }}
            >
              {isAnonymous ? 'Anonymous' : userName}
            </Button>
          )}
        </Box>

        {/* Comment Input - Word-like WYSIWYG Editor with hidden toolbar */}
        <Box sx={{ 
          mb: isMobile ? 2 : 3,
          p: isMobile ? 1.5 : 2,
          borderRadius: 2,
          backgroundColor: 'transparent',
          display: 'flex',
          gap: isMobile ? 1.5 : 2,
          alignItems: 'flex-start',
        }}>
          <Avatar sx={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, bgcolor: '#667eea', border: 'none' }}>
            <Person />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            {userEmail ? (
              <Box sx={getMainQuillStyles(isMainFocused)}>
                <ReactQuill
                  theme="snow"
                  value={newComment}
                  onChange={setNewComment}
                  modules={quillModulesMain}
                  formats={quillFormats}
                  placeholder="What are your thoughts? (Click to show toolbar)"
                  onFocus={() => setIsMainFocused(true)}
                  onBlur={() => {
                    if (!newComment || newComment === '<p><br></p>') {
                      setIsMainFocused(false);
                    }
                  }}
                />
              </Box>
            ) : (
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Click here to add your name and email to comment"
                value={newComment}
                disabled
                variant="outlined"
                onClick={() => {
                  setPendingAction('comment');
                  setDialogMode('initial');
                  setDialogOpen(true);
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'transparent',
                    fontSize: '0.9375rem',
                    fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: 'none',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover fieldset': {
                      border: 'none',
                    },
                  },
                }}
              />
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {userEmail ? (
                  <Typography variant="caption" color="text.secondary">
                    Posting as: {isAnonymous ? 'Anonymous' : userName || 'User'}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Click the text box to add your details
                  </Typography>
                )}
                {newComment && newComment !== '<p><br></p>' && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                    • {newComment.replace(/<[^>]*>/g, '').length} characters
                  </Typography>
                )}
              </Box>
              <Button
                onClick={handleAddComment}
                disabled={isSubmitting || !newComment.trim() || newComment === '<p><br></p>' || !userEmail}
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Send sx={{ fontSize: 16 }} />}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none', 
                  fontWeight: 600,
                  px: 3,
                  py: 0.75,
                  minWidth: 'auto',
                  fontSize: '0.8125rem',
                  background: isDark 
                    ? 'linear-gradient(135deg, rgba(144, 202, 249, 0.2), rgba(144, 202, 249, 0.05))'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: isDark ? '#90caf9' : '#fff',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(144, 202, 249, 0.2)' : 'transparent',
                  boxShadow: isDark 
                    ? 'none'
                    : '0 4px 20px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(144, 202, 249, 0.3), rgba(144, 202, 249, 0.1))'
                      : 'linear-gradient(135deg, #5a6fd6 0%, #6a3f9a 100%)',
                    boxShadow: isDark 
                      ? '0 0 30px rgba(144, 202, 249, 0.1)'
                      : '0 6px 30px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'scale(0.97)',
                  },
                  '&:disabled': {
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                    boxShadow: 'none',
                    transform: 'none',
                    borderColor: 'transparent',
                  },
                }}
              >
                {isSubmitting ? 'Sending...' : 'Post'}
              </Button>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ 
          my: isMobile ? 1.5 : 2,
          borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        }} />

        {comments.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: isMobile ? 3 : 4, 
            backgroundColor: 'transparent', 
            borderRadius: 2,
          }}>
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

      {/* User Dialog */}
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