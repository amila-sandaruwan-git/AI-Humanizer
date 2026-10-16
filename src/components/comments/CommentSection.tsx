// src/components/comments/CommentSection.tsx

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
  KeyboardArrowDown,
  KeyboardArrowUp,
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

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'blockquote', 'code-block',
  'list', 'bullet',
  'link',
];

// ============================================================
// Quill modules — minimal toolbar, essentials only
// ============================================================
const getQuillModules = (isMobile: boolean) => ({
  toolbar: {
    container: isMobile
      ? [
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link'],
        ]
      : [
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link'],
        ],
  },
});

// ============================================================
// Quill styles — toolbar reserves its space (no layout shift)
// ============================================================
const getQuillStyles = (
  isDark: boolean,
  isMobile: boolean,
  isFocused: boolean,
  isReply: boolean
) => {
  // Fixed toolbar height — never changes, so no scroll jump
  const toolbarHeight = isMobile ? 44 : 46;

  return {
    minHeight: isReply ? (isMobile ? '60px' : '80px') : isMobile ? '80px' : '110px',
    maxHeight: isReply ? 260 : 420,
    backgroundColor: 'transparent',
    color: isDark ? '#e0e0e0' : '#2b2f45',
    border: 'none',
    borderRadius: '10px',

    // ============ TOOLBAR ============
    // Height NEVER changes — only visibility toggles.
    // This prevents the page-scroll jump when focus changes.
    '& .ql-toolbar.ql-snow': {
      display: 'flex !important',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: isMobile ? '4px' : '6px',

      // Always reserve this height so the layout doesn't shift
      minHeight: `${toolbarHeight}px !important`,
      height: `${toolbarHeight}px !important`,
      maxHeight: `${toolbarHeight}px !important`,
      boxSizing: 'border-box',

      // Visibility toggle — no layout change
      visibility: isFocused ? 'visible' : 'hidden',
      opacity: isFocused ? 1 : 0,
      pointerEvents: isFocused ? 'auto' : 'none',

      // Smooth fade only (no height animation)
      transition: 'opacity 0.18s ease',

      border: 'none',
      borderBottom: `1px solid ${
        isDark ? 'rgba(255,255,255,0.08)' : 'rgba(43,47,69,0.08)'
      } !important`,
      padding: isMobile ? '4px 4px !important' : '6px 4px !important',
      margin: '0 !important',
    },

    // Buttons
    '& .ql-toolbar.ql-snow button': {
      display: 'inline-flex !important',
      alignItems: 'center !important',
      justifyContent: 'center !important',
      width: isMobile ? '34px !important' : '32px !important',
      height: isMobile ? '34px !important' : '32px !important',
      padding: '6px !important',
      margin: '0 !important',
      borderRadius: '8px !important',
      backgroundColor: 'transparent !important',
      border: 'none !important',
      cursor: 'pointer !important',
      transition: 'background-color 0.12s ease',
      '&:hover': {
        backgroundColor: isDark
          ? 'rgba(255,255,255,0.08) !important'
          : 'rgba(43,47,69,0.05) !important',
      },
      '&.ql-active': {
        backgroundColor: isDark
          ? 'rgba(144,202,249,0.18) !important'
          : 'rgba(91,111,214,0.1) !important',
      },
    },

    // SVG icons
    '& .ql-toolbar.ql-snow button svg': {
      display: 'block !important',
      visibility: 'visible !important',
      opacity: '1 !important',
      width: '18px !important',
      height: '18px !important',
      minWidth: '18px !important',
      minHeight: '18px !important',
      overflow: 'visible !important',
    },

    '& .ql-toolbar.ql-snow .ql-stroke': {
      stroke: isDark ? '#ffffff !important' : '#2b2f45 !important',
      strokeWidth: '2 !important',
      fill: 'none !important',
    },
    '& .ql-toolbar.ql-snow .ql-fill': {
      fill: isDark ? '#ffffff !important' : '#2b2f45 !important',
      stroke: 'none !important',
    },
    '& .ql-toolbar.ql-snow button.ql-active .ql-stroke': {
      stroke: isDark ? '#90caf9 !important' : '#5b6fd6 !important',
      strokeWidth: '2.6 !important',
    },
    '& .ql-toolbar.ql-snow button.ql-active .ql-fill': {
      fill: isDark ? '#90caf9 !important' : '#5b6fd6 !important',
    },

    '& .ql-toolbar.ql-snow .ql-formats': {
      display: 'inline-flex !important',
      alignItems: 'center !important',
      gap: '4px !important',
      margin: '0 !important',
      marginRight: isMobile ? '4px !important' : '8px !important',
    },

    // ============ EDITOR ============
    '& .ql-container.ql-snow': {
      backgroundColor: 'transparent',
      border: 'none',
      fontSize: isMobile ? '16px' : '0.9375rem',
      fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
      minHeight: isReply
        ? isMobile
          ? '55px'
          : '75px'
        : isMobile
        ? '75px'
        : '105px',
      maxHeight: isReply ? 240 : 400,
      overflowY: 'auto',
      lineHeight: 1.7,
    },
    '& .ql-container.ql-snow .ql-editor': {
      color: isDark ? '#e0e0e0' : '#2b2f45',
      minHeight: isReply
        ? isMobile
          ? '55px'
          : '75px'
        : isMobile
        ? '75px'
        : '105px',
      maxHeight: isReply ? 240 : 400,
      overflowY: 'auto',
      padding: isMobile ? '8px 2px' : '10px 4px',
      fontSize: isMobile ? '16px' : '0.9375rem',
      lineHeight: 1.7,
      '&:focus': { outline: 'none' },
    },
    '& .ql-container.ql-snow .ql-editor.ql-blank::before': {
      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(43,47,69,0.4)',
      fontStyle: 'normal',
      left: isMobile ? 2 : 4,
      fontSize: isMobile ? '15px' : '0.9375rem',
    },
  };
};

// ============================================================
// SINGLE COMMENT
// ============================================================
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

  const maxDepthMobile = 2;
  const shouldNestMobile = isMobile && depth < maxDepthMobile;

  const quillModulesReply = useMemo(
    () => getQuillModules(isMobile),
    [isMobile]
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

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
      showSuccess('Comment updated');
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
    if (replyingTo !== comment.id) setReplyingTo(comment.id);
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
      showSuccess('Reply added');
    } catch {
      showError('Failed to add reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const toggleReplies = () => setShowReplies(!showReplies);

  const getUserInitials = (name: string): string => {
    if (name === 'Anonymous') return 'A';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (userId: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFD93D', '#DDA0DD', '#FF8A5C', '#A29BFE',
    ];
    const index = userId
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const displayName = comment.is_anonymous ? 'Anonymous' : comment.user_name;
  const initials = getUserInitials(displayName);
  const avatarColor = getAvatarColor(comment.user_id);
  const avatarSize = isMobile ? 36 : 40;

  return (
    <Box
      sx={{
        ml: isReply ? (shouldNestMobile ? 1.5 : 0) : 0,
        pl: isReply ? (shouldNestMobile ? 1.5 : 0) : 0,
        borderLeft: isReply && shouldNestMobile
          ? `2px solid ${avatarColor}22`
          : 'none',
        position: 'relative',
        pt: 1,
        pb: 0.5,
      }}
    >
      <Fade in timeout={200}>
        <Box
          sx={{
            p: isMobile ? 1.25 : 2,
            mb: 0.5,
            borderRadius: 2,
            backgroundColor: 'transparent',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: isMobile ? 1.25 : 2,
            }}
          >
            <Avatar
              sx={{
                width: avatarSize,
                height: avatarSize,
                bgcolor: avatarColor,
                fontSize: isMobile ? '0.8125rem' : '1rem',
                fontWeight: 600,
                border: 'none',
                flexShrink: 0,
              }}
            >
              {initials}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  flexWrap: 'wrap',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    fontSize: isMobile ? '0.875rem' : '0.9375rem',
                    color: 'text.primary',
                  }}
                >
                  {displayName}
                </Typography>
                {comment.is_anonymous && (
                  <Chip
                    label="Anon"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      '& .MuiChip-label': { px: 0.75 },
                      border: 'none',
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(43,47,69,0.05)',
                    }}
                  />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                  }}
                >
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                  })}
                </Typography>
                {isOwner && (
                  <Chip
                    label="You"
                    size="small"
                    color="primary"
                    sx={{
                      height: 18,
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      '& .MuiChip-label': { px: 0.75 },
                      border: 'none',
                    }}
                  />
                )}
              </Box>

              {editingComment === comment.id ? (
                <Box sx={{ mt: 1 }}>
                  <Box sx={getQuillStyles(isDark, isMobile, true, true)}>
                    <ReactQuill
                      theme="snow"
                      value={editContent}
                      onChange={setEditContent}
                      modules={quillModulesReply}
                      formats={quillFormats}
                      placeholder="Edit your comment..."
                    />
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleSaveEdit}
                      startIcon={<Send />}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        minHeight: 40,
                        fontWeight: 600,
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setEditingComment(null)}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        minHeight: 40,
                        fontWeight: 600,
                      }}
                    >
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
                    overflowWrap: 'break-word',
                    mt: 0.5,
                    padding: 0,
                    maxHeight: 400,
                    overflowY: 'auto',
                    border: 'none',
                    WebkitOverflowScrolling: 'touch',
                    '& p': { margin: '0 0 4px 0' },
                    '& ul, & ol': { paddingLeft: '20px', margin: '4px 0' },
                    '& blockquote': {
                      borderLeft: `4px solid ${isDark ? '#90caf9' : '#5b6fd6'}`,
                      paddingLeft: '12px',
                      margin: '8px 0',
                      color: isDark ? '#b0b0c8' : '#666',
                      fontStyle: 'italic',
                    },
                    '& a': {
                      color: isDark ? '#90caf9' : '#5b6fd6',
                      textDecoration: 'underline',
                      wordBreak: 'break-all',
                    },
                    '& strong': { fontWeight: 700 },
                    '& em': { fontStyle: 'italic' },
                    '& u': { textDecoration: 'underline' },
                    '& strike': { textDecoration: 'line-through' },
                    '& code': {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.06)'
                        : '#f5f5f5',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '0.85em',
                    },
                  }}
                  dangerouslySetInnerHTML={{ __html: comment.content }}
                />
              )}

              {editingComment !== comment.id && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 0.5 : 1,
                    mt: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  <Button
                    size="small"
                    startIcon={<Reply sx={{ fontSize: 16 }} />}
                    onClick={handleReplyClick}
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: 1.5,
                      textTransform: 'none',
                      minHeight: 36,
                      px: 1.25,
                      border: 'none',
                      '&:hover': {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(91,111,214,0.05)',
                        color: isDark ? '#90caf9' : '#5b6fd6',
                      },
                    }}
                  >
                    Reply
                  </Button>

                  {hasReplies && (
                    <Button
                      size="small"
                      onClick={toggleReplies}
                      startIcon={
                        showReplies ? (
                          <KeyboardArrowUp sx={{ fontSize: 16 }} />
                        ) : (
                          <KeyboardArrowDown sx={{ fontSize: 16 }} />
                        )
                      }
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: 1.5,
                        textTransform: 'none',
                        minHeight: 36,
                        px: 1.25,
                        border: 'none',
                        '&:hover': {
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.04)'
                            : 'rgba(91,111,214,0.05)',
                        },
                      }}
                    >
                      {showReplies
                        ? `Hide ${comment.replies?.length}`
                        : `Show ${comment.replies?.length}`}
                    </Button>
                  )}

                  {isOwner && (
                    <IconButton
                      size="small"
                      onClick={handleMenuOpen}
                      aria-label="Comment actions"
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        border: 'none',
                        ml: 'auto',
                        color: 'text.secondary',
                        '&:hover': {
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(91,111,214,0.06)',
                        },
                      }}
                    >
                      <MoreVert sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}

                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    slotProps={{
                      paper: {
                        sx: {
                          mt: 0.5,
                          borderRadius: 2,
                          minWidth: 180,
                          backgroundColor: isDark ? '#1e1e30' : '#ffffff',
                          border: `1px solid ${
                            isDark
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(43,47,69,0.08)'
                          }`,
                          boxShadow: isDark
                            ? '0 12px 32px rgba(0,0,0,0.5)'
                            : '0 12px 32px rgba(43,47,69,0.12)',
                        },
                      },
                    }}
                  >
                    <MenuItem
                      onClick={handleEdit}
                      sx={{ minHeight: 44, py: 1, px: 1.75 }}
                    >
                      <Edit fontSize="small" sx={{ mr: 1.5 }} /> Edit
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleMenuClose();
                        onEditUser();
                      }}
                      sx={{ minHeight: 44, py: 1, px: 1.75 }}
                    >
                      <Person fontSize="small" sx={{ mr: 1.5 }} /> Edit Profile
                    </MenuItem>
                    <MenuItem
                      onClick={handleDelete}
                      sx={{ minHeight: 44, py: 1, px: 1.75, color: 'error.main' }}
                    >
                      <Delete
                        fontSize="small"
                        color="error"
                        sx={{ mr: 1.5 }}
                      />
                      Delete
                    </MenuItem>
                  </Menu>
                </Box>
              )}
            </Box>
          </Box>

          <Collapse in={showReplyBox && !!userEmail} timeout={200}>
            <Box sx={{ mt: 1.5, pl: isMobile ? 4 : 6 }}>
              <Divider
                sx={{
                  mb: 1.5,
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(43,47,69,0.05)',
                }}
              />
              <Box sx={{ display: 'flex', gap: isMobile ? 1 : 2 }}>
                <Avatar
                  sx={{
                    width: isMobile ? 28 : 32,
                    height: isMobile ? 28 : 32,
                    bgcolor: '#5b6fd6',
                    border: 'none',
                    flexShrink: 0,
                  }}
                >
                  <Person fontSize="small" />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={getQuillStyles(isDark, isMobile, isReplyFocused, true)}>
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
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 1,
                      mt: 1,
                    }}
                  >
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
                        minHeight: 40,
                        px: 1.5,
                        fontWeight: 600,
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      onClick={handleSubmitReply}
                      disabled={
                        !replyContent.trim() ||
                        replyContent === '<p><br></p>' ||
                        isSubmittingReply
                      }
                      startIcon={
                        isSubmittingReply ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <Send sx={{ fontSize: 14 }} />
                        )
                      }
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        minHeight: 40,
                        px: 2.5,
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(144, 202, 249, 0.2), rgba(144, 202, 249, 0.05))'
                          : 'linear-gradient(135deg, #5b6fd6 0%, #764ba2 100%)',
                        color: isDark ? '#90caf9' : '#fff',
                        border: '1px solid',
                        borderColor: isDark
                          ? 'rgba(144, 202, 249, 0.2)'
                          : 'transparent',
                        boxShadow: 'none',
                        '&:hover': { boxShadow: 'none' },
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

// ============================================================
// MAIN COMMENT SECTION
// ============================================================
export const CommentSection: React.FC<CommentSectionProps> = ({
  onCommentAdded,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';
  const { showSuccess, showError } = useToast();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(() =>
    localStorage.getItem('commentUserEmail')
  );
  const [userName, setUserName] = useState<string | null>(() =>
    localStorage.getItem('commentUserName')
  );
  const [isAnonymous, setIsAnonymous] = useState<boolean>(
    () => localStorage.getItem('commentIsAnonymous') === 'true'
  );
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'initial' | 'edit'>('initial');
  const [pendingAction, setPendingAction] = useState<'comment' | 'reply' | null>(
    null
  );
  const [existingUser, setExistingUser] = useState<{
    email: string;
    name: string;
    is_anonymous: boolean;
  } | null>(null);
  const [isMainFocused, setIsMainFocused] = useState(false);
  const isMounted = useRef(true);

  const quillModulesMain = useMemo(
    () => getQuillModules(isMobile),
    [isMobile]
  );

  const openJoinDialog = useCallback(() => {
    setPendingAction('comment');
    setDialogMode('initial');
    setDialogOpen(true);
  }, []);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await commentService.getComments();
      if (isMounted.current) setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchComments();

    const channel = supabase
      .channel('comments-global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        async () => {
          await fetchComments();
          if (onCommentAdded) onCommentAdded();
        }
      )
      .subscribe();

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
          if (!user.is_anonymous) setUserName(user.name);
        } else {
          setExistingUser(null);
        }
      }
    };
    checkUser();
  }, [userEmail]);

  const handleUserSubmit = async (user: {
    email: string;
    name: string;
    is_anonymous: boolean;
  }) => {
    const isUpdate = existingUser && existingUser.email === user.email;

    if (isUpdate) {
      try {
        await commentService.updateUserProfile(
          user.email,
          user.name,
          user.is_anonymous
        );
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
        showSuccess('Profile updated');
      } catch {
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
    if (pendingAction === 'comment') await handleAddComment();
    setPendingAction(null);
  };

  const handleUpdateUser = async (user: {
    email: string;
    name: string;
    is_anonymous: boolean;
  }) => {
    try {
      await commentService.updateUserProfile(
        user.email,
        user.name,
        user.is_anonymous
      );
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
      showSuccess('Profile updated');
      setDialogOpen(false);
    } catch {
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
      showSuccess('Comment added');
    } catch {
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
      await commentService.updateComment(commentId, content, userEmail);
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) return { ...c, content };
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === commentId ? { ...r, content } : r
              ),
            };
          }
          return c;
        })
      );
      showSuccess('Comment updated');
    } catch (error: any) {
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
      await commentService.deleteComment(commentId, userEmail);
      setComments((prev) =>
        prev
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: c.replies?.filter((r) => r.id !== commentId) || [],
          }))
      );
      showSuccess('Comment deleted');
    } catch (error: any) {
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
      <Box sx={{ p: isMobile ? 1.5 : 3, mt: isMobile ? 2 : 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: isMobile ? 2 : 3,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography
            variant={isMobile ? 'subtitle1' : 'h6'}
            sx={{
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: 'text.primary',
              fontSize: isMobile ? '1rem' : '1.15rem',
            }}
          >
            Discussion
            <Chip
              label={comments.length}
              size="small"
              sx={{
                fontWeight: 600,
                height: 22,
                fontSize: '0.7rem',
                backgroundColor: isDark
                  ? 'rgba(144, 202, 249, 0.15)'
                  : 'rgba(91,111,214,0.1)',
                color: isDark ? '#90caf9' : '#5b6fd6',
                border: 'none',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          </Typography>
          {userEmail && (
            <Button
              size="small"
              startIcon={<Person sx={{ fontSize: 16 }} />}
              onClick={handleEditUser}
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                minHeight: 36,
                px: 1.25,
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(43,47,69,0.7)',
                border: 'none',
                borderRadius: 1.5,
                '&:hover': {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(91,111,214,0.06)',
                },
              }}
            >
              {isAnonymous ? 'Anonymous' : userName}
            </Button>
          )}
        </Box>

        <Box
          sx={{
            mb: isMobile ? 2 : 3,
            p: isMobile ? 1.25 : 2,
            borderRadius: 2,
            backgroundColor: 'transparent',
            display: 'flex',
            gap: isMobile ? 1.25 : 2,
            alignItems: 'flex-start',
          }}
        >
          <Avatar
            sx={{
              width: isMobile ? 36 : 40,
              height: isMobile ? 36 : 40,
              bgcolor: '#5b6fd6',
              border: 'none',
              flexShrink: 0,
            }}
          >
            <Person />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {userEmail ? (
              <Box sx={getQuillStyles(isDark, isMobile, isMainFocused, false)}>
                <ReactQuill
                  theme="snow"
                  value={newComment}
                  onChange={setNewComment}
                  modules={quillModulesMain}
                  formats={quillFormats}
                  placeholder="Write a comment..."
                  onFocus={() => setIsMainFocused(true)}
                  onBlur={() => {
                    if (!newComment || newComment === '<p><br></p>') {
                      setIsMainFocused(false);
                    }
                  }}
                />
              </Box>
            ) : (
              <Box
                onClick={openJoinDialog}
                onTouchStart={openJoinDialog}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openJoinDialog();
                  }
                }}
                aria-label="Tap to add your name and email to comment"
                sx={{
                  width: '100%',
                  minHeight: 96,
                  px: 2,
                  py: 1.75,
                  borderRadius: 2,
                  border: `1px solid ${
                    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(43,47,69,0.1)'
                  }`,
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(91,111,214,0.02)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition:
                    'border-color 0.15s ease, background-color 0.15s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'none',
                  '&:hover, &:active': {
                    borderColor: isDark
                      ? 'rgba(144,202,249,0.4)'
                      : 'rgba(91,111,214,0.4)',
                    backgroundColor: isDark
                      ? 'rgba(144,202,249,0.05)'
                      : 'rgba(91,111,214,0.04)',
                  },
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: isDark ? '#90caf9' : '#5b6fd6',
                    outlineOffset: 2,
                  },
                }}
              >
                <Typography
                  sx={{
                    color: isDark
                      ? 'rgba(255,255,255,0.45)'
                      : 'rgba(43,47,69,0.5)',
                    fontSize: '16px',
                    fontStyle: 'italic',
                    fontFamily:
                      'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                    pointerEvents: 'none',
                  }}
                >
                  Tap here to add your name and email to comment
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 1,
                flexWrap: 'wrap',
                gap: 0.75,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  minWidth: 0,
                }}
              >
                {userEmail ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.7rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    Posting as:{' '}
                    {isAnonymous ? 'Anonymous' : userName || 'User'}
                  </Typography>
                ) : (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: '0.7rem' }}
                  >
                    Tap the text box to add your details
                  </Typography>
                )}
              </Box>
              <Button
                onClick={handleAddComment}
                disabled={
                  isSubmitting ||
                  !newComment.trim() ||
                  newComment === '<p><br></p>' ||
                  !userEmail
                }
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Send sx={{ fontSize: 16 }} />
                  )
                }
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2.5,
                  py: 1,
                  minWidth: 'auto',
                  minHeight: 44,
                  fontSize: '0.8125rem',
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(144, 202, 249, 0.2), rgba(144, 202, 249, 0.05))'
                    : 'linear-gradient(135deg, #5b6fd6 0%, #764ba2 100%)',
                  color: isDark ? '#90caf9' : '#fff',
                  border: '1px solid',
                  borderColor: isDark
                    ? 'rgba(144, 202, 249, 0.2)'
                    : 'transparent',
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 'none' },
                  '&:disabled': {
                    background: isDark
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(43,47,69,0.06)',
                    color: isDark
                      ? 'rgba(255,255,255,0.25)'
                      : 'rgba(43,47,69,0.25)',
                    borderColor: 'transparent',
                  },
                }}
              >
                {isSubmitting ? 'Sending...' : 'Post'}
              </Button>
            </Box>
          </Box>
        </Box>

        <Divider
          sx={{
            my: isMobile ? 1.5 : 2,
            borderColor: isDark
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(43,47,69,0.06)',
          }}
        />

        {comments.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: isMobile ? 3 : 4,
              backgroundColor: 'transparent',
              borderRadius: 2,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: '0.8125rem' }}
            >
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

      <CommentDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setPendingAction(null);
        }}
        onSubmit={handleUserSubmit}
        onUpdate={handleUpdateUser}
        title={
          dialogMode === 'edit' ? 'Edit Your Profile' : 'Join the Conversation'
        }
        submitLabel={dialogMode === 'edit' ? 'Update' : 'Continue'}
        updateLabel="Save Changes"
        existingUser={dialogMode === 'edit' ? existingUser : null}
        isEditing={dialogMode === 'edit'}
      />
    </>
  );
};