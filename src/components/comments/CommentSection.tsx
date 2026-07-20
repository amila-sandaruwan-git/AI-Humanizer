// src/components/comments/CommentSection.tsx

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
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
  Paper,
} from '@mui/material';
import {
  ThumbUp,
  ThumbUpOutlined,
  ThumbDown,
  ThumbDownOutlined,
  Reply,
  MoreVert,
  Edit,
  Delete,
  Send,
  Login,
  ExpandMore,
  ExpandLess,
  FiberManualRecord,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { commentService, CommentWithUser } from '../../services/commentService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface CommentSectionProps {
  onCommentAdded?: () => void;
  onAuthRequired?: () => void;
}

interface SingleCommentProps {
  comment: CommentWithUser;
  onDelete: (commentId: string) => void;
  onVote: (commentId: string, voteType: 'like' | 'dislike' | null) => void;
  onAddReply: (content: string, parentId: string) => Promise<void>;
  depth?: number;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  onToggleReplies?: (commentId: string) => void;
  showReplies?: boolean;
  maxDepth?: number;
  isLastInThread?: boolean;
}

// Color palette for thread lines
const threadColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFD93D', '#DDA0DD', '#FF8A5C', '#A29BFE'
];

const getThreadColor = (depth: number) => {
  return threadColors[depth % threadColors.length];
};

// Memoized Comment Content
const CommentContent = memo(({ content }: { content: string }) => {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 200;
  
  if (content.length <= maxLength) {
    return <Typography variant="body2" sx={{ 
      fontSize: '0.9375rem', 
      lineHeight: 1.7,
      fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
      color: 'text.primary',
      letterSpacing: '-0.01em',
      whiteSpace: 'pre-wrap', 
      wordWrap: 'break-word',
    }}>
      {content}
    </Typography>;
  }

  const displayText = expanded ? content : content.slice(0, maxLength) + '...';
  
  return (
    <Typography variant="body2" sx={{ 
      fontSize: '0.9375rem', 
      lineHeight: 1.7,
      fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
      color: 'text.primary',
      letterSpacing: '-0.01em',
      whiteSpace: 'pre-wrap', 
      wordWrap: 'break-word',
    }}>
      {displayText}
      <Button
        size="small"
        onClick={() => setExpanded(!expanded)}
        sx={{ 
          textTransform: 'none', 
          fontSize: '0.8125rem', 
          color: 'primary.main',
          fontWeight: 600,
          minWidth: 'auto',
          p: 0,
          ml: 0.5,
          fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
          letterSpacing: '-0.01em',
        }}
      >
        {expanded ? 'Show less' : 'Read more'}
      </Button>
    </Typography>
  );
});

CommentContent.displayName = 'CommentContent';

// Single Comment Component
const SingleComment = memo((props: SingleCommentProps) => {
  const { 
    comment, 
    onDelete, 
    onVote, 
    onAddReply,
    depth = 0,
    isAuthenticated,
    onAuthRequired,
    replyingTo,
    setReplyingTo,
    onToggleReplies,
    showReplies = true,
    maxDepth = 2,
    isLastInThread = false,
  } = props;

  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [localComment, setLocalComment] = useState(comment);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const { showSuccess, showError } = useToast();

  const isOwner = user?.id === comment.user_id;
  const hasReplies = localComment.replies && localComment.replies.length > 0;
  const isCollapsed = !showReplies;
  const threadColor = getThreadColor(depth);
  const isReply = depth > 0;
  const showFullThread = depth < maxDepth;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
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
      await commentService.updateComment(comment.id, editContent);
      setLocalComment({ ...localComment, content: editContent });
      setIsEditing(false);
      showSuccess('Comment updated!');
    } catch (error) {
      showError('Failed to update comment');
    }
  };

  // Updated handleVote with proper vote removal
  const handleVote = async (voteType: 'like' | 'dislike' | null) => {
    try {
      // Call the service to update the vote in database
      await onVote(comment.id, voteType);
      
      // Update local state optimistically
      const currentVote = localComment.user_vote;
      
      if (currentVote === voteType) {
        // Removing vote (clicked the same button)
        setLocalComment({
          ...localComment,
          user_vote: null,
          likes: localComment.likes - (voteType === 'like' ? 1 : 0),
          dislikes: localComment.dislikes - (voteType === 'dislike' ? 1 : 0),
        });
      } else {
        // Changing vote or adding new vote
        let newLikes = localComment.likes;
        let newDislikes = localComment.dislikes;
        
        if (currentVote === 'like') newLikes--;
        if (currentVote === 'dislike') newDislikes--;
        if (voteType === 'like') newLikes++;
        if (voteType === 'dislike') newDislikes++;
        
        setLocalComment({
          ...localComment,
          user_vote: voteType,
          likes: newLikes,
          dislikes: newDislikes,
        });
      }
    } catch (error) {
      showError('Failed to vote');
    }
  };

  const handleReplyClick = () => {
    if (!isAuthenticated) {
      onAuthRequired();
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

  const handleToggleReplies = () => {
    if (onToggleReplies) {
      onToggleReplies(comment.id);
    }
  };

  const getUserDisplayName = (commentItem: CommentWithUser): string => {
    return commentItem.user?.user_metadata?.full_name || 
           commentItem.user?.email?.split('@')[0] || 
           'User';
  };

  const getUserAvatar = (commentItem: CommentWithUser): string => {
    return commentItem.user?.user_metadata?.avatar_url || '';
  };

  const getUserInitials = (commentItem: CommentWithUser): string => {
    const name = getUserDisplayName(commentItem);
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

  const displayName = getUserDisplayName(localComment);
  const initials = getUserInitials(localComment);
  const avatarUrl = getUserAvatar(localComment);
  const avatarColor = getAvatarColor(comment.user_id);

  const avatarSize = isMobile ? 32 : 40;

  return (
    <Box 
      sx={{ 
        ml: isReply ? (isMobile ? 2 : 3) : 0,
        pl: isReply ? (isMobile ? 1.5 : 2) : 0,
        borderLeft: isReply ? `2px solid ${threadColor}40` : 'none',
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      {isReply && (
        <>
          <Box
            sx={{
              position: 'absolute',
              left: -1,
              top: -8,
              width: 2,
              height: 16,
              backgroundColor: threadColor,
              opacity: 0.4,
            }}
          />
          {!isLastInThread && (
            <Box
              sx={{
                position: 'absolute',
                left: -1,
                bottom: -4,
                width: 2,
                height: 12,
                backgroundColor: threadColor,
                opacity: 0.3,
              }}
            />
          )}
        </>
      )}

      <Fade in={true} timeout={200}>
        <Paper
          elevation={0}
          sx={{
            p: isMobile ? 1.5 : 2,
            mb: 0.5,
            borderRadius: 2,
            backgroundColor: isReply ? 'rgba(0,0,0,0.02)' : 'transparent',
            transition: 'all 0.2s ease',
            border: '1px solid',
            borderColor: 'transparent',
            '&:hover': {
              backgroundColor: isReply ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.02)',
              borderColor: 'divider',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? 1.5 : 2 }}>
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Avatar 
                src={avatarUrl || undefined}
                sx={{ 
                  width: avatarSize, 
                  height: avatarSize,
                  bgcolor: avatarUrl ? 'transparent' : avatarColor,
                  fontSize: isMobile ? '0.75rem' : '1rem',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '2px solid',
                  borderColor: 'background.paper',
                }}
              >
                {!avatarUrl && initials}
              </Avatar>
              
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 700, 
                  fontSize: isMobile ? '0.875rem' : '0.9375rem',
                  color: 'text.primary',
                  fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                  letterSpacing: '-0.01em',
                }}>
                  {displayName}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary', 
                  fontSize: isMobile ? '0.65rem' : '0.75rem',
                  fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                  letterSpacing: '-0.01em',
                }}>
                  {formatDistanceToNow(new Date(localComment.created_at), { addSuffix: true })}
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
                      fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                      fontWeight: 600,
                      '& .MuiChip-label': { px: 0.75 },
                    }} 
                  />
                )}
              </Box>

              {isEditing ? (
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
                    <Button variant="outlined" size="small" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <CommentContent content={localComment.content} />
              )}

              {!isEditing && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.25 : 0.5, mt: 1, flexWrap: 'wrap' }}>
                  <Tooltip title={isAuthenticated ? 'Like' : 'Login to like'}>
                    <Button
                      size="small"
                      startIcon={localComment.user_vote === 'like' ? 
                        <ThumbUp sx={{ color: '#FF6B6B', fontSize: isMobile ? 16 : 18 }} /> : 
                        <ThumbUpOutlined sx={{ fontSize: isMobile ? 16 : 18 }} />
                      }
                      onClick={() => handleVote(localComment.user_vote === 'like' ? null : 'like')}
                      disabled={!isAuthenticated}
                      sx={{ 
                        minWidth: 'auto', 
                        px: isMobile ? 0.5 : 1, 
                        py: 0.5, 
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        color: localComment.user_vote === 'like' ? '#FF6B6B' : 'text.secondary',
                        borderRadius: 2,
                        fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                        '&:hover': {
                          backgroundColor: 'rgba(255,107,107,0.08)',
                        },
                      }}
                    >
                      {localComment.likes > 0 && localComment.likes}
                    </Button>
                  </Tooltip>

                  <Tooltip title={isAuthenticated ? 'Dislike' : 'Login to dislike'}>
                    <Button
                      size="small"
                      startIcon={localComment.user_vote === 'dislike' ? 
                        <ThumbDown sx={{ color: '#45B7D1', fontSize: isMobile ? 16 : 18 }} /> : 
                        <ThumbDownOutlined sx={{ fontSize: isMobile ? 16 : 18 }} />
                      }
                      onClick={() => handleVote(localComment.user_vote === 'dislike' ? null : 'dislike')}
                      disabled={!isAuthenticated}
                      sx={{ 
                        minWidth: 'auto', 
                        px: isMobile ? 0.5 : 1, 
                        py: 0.5, 
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        color: localComment.user_vote === 'dislike' ? '#45B7D1' : 'text.secondary',
                        borderRadius: 2,
                        fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                        '&:hover': {
                          backgroundColor: 'rgba(69,183,209,0.08)',
                        },
                      }}
                    >
                      {localComment.dislikes > 0 && localComment.dislikes}
                    </Button>
                  </Tooltip>

                  <Divider orientation="vertical" flexItem sx={{ mx: 0.25, height: isMobile ? 16 : 20 }} />

                  <Button
                    size="small"
                    startIcon={<Reply sx={{ fontSize: isMobile ? 16 : 18 }} />}
                    onClick={handleReplyClick}
                    sx={{ 
                      color: 'text.secondary', 
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.04)',
                      },
                    }}
                  >
                    Reply
                  </Button>

                  {hasReplies && showFullThread && (
                    <Button
                      size="small"
                      onClick={handleToggleReplies}
                      startIcon={isCollapsed ? <ExpandMore sx={{ fontSize: isMobile ? 16 : 18 }} /> : <ExpandLess sx={{ fontSize: isMobile ? 16 : 18 }} />}
                      sx={{ 
                        color: 'text.secondary', 
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        borderRadius: 2,
                        textTransform: 'none',
                        fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      {isCollapsed ? `Show ${localComment.replies?.length}` : `Hide`}
                    </Button>
                  )}

                  {isOwner && (
                    <IconButton size="small" onClick={handleMenuOpen} sx={{ p: 0.5 }}>
                      <MoreVert sx={{ fontSize: isMobile ? 16 : 18 }} />
                    </IconButton>
                  )}
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <MenuItem onClick={handleEdit}>
                      <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
                    </MenuItem>
                    <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                      <Delete fontSize="small" color="error" sx={{ mr: 1 }} /> Delete
                    </MenuItem>
                  </Menu>
                </Box>
              )}
            </Box>
          </Box>

          <Collapse in={showReplyBox && isAuthenticated} timeout="auto">
            <Box sx={{ mt: 1.5, pl: isMobile ? 4 : 6 }}>
              <Divider sx={{ mb: 1.5 }} />
              <Box sx={{ display: 'flex', gap: isMobile ? 1 : 2 }}>
                <Avatar 
                  src={user?.user_metadata?.avatar_url || ''}
                  sx={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32 }}
                >
                  {user?.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'}
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
                        fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
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
                        fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
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
                        fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                      }}
                    >
                      Reply
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Collapse>

          {hasReplies && !showFullThread && (
            <Box sx={{ mt: 1, ml: isMobile ? 4 : 6 }}>
              <Button
                size="small"
                startIcon={<ExpandMore />}
                onClick={handleToggleReplies}
                sx={{ 
                  color: 'primary.main', 
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  textTransform: 'none',
                  fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                }}
              >
                View {localComment.replies?.length} more replies
              </Button>
            </Box>
          )}
        </Paper>
      </Fade>

      {hasReplies && showFullThread && (
        <Collapse in={!isCollapsed} timeout="auto">
          <Box sx={{ ml: 0, mt: 0.25 }}>
            {localComment.replies?.map((reply: CommentWithUser, index: number) => (
              <SingleComment
                key={reply.id}
                comment={reply}
                onDelete={onDelete}
                onVote={onVote}
                onAddReply={onAddReply}
                depth={depth + 1}
                isAuthenticated={isAuthenticated}
                onAuthRequired={onAuthRequired}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                onToggleReplies={onToggleReplies}
                showReplies={showReplies}
                maxDepth={maxDepth}
                isLastInThread={index === (localComment.replies?.length || 0) - 1}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
});

SingleComment.displayName = 'SingleComment';

export const CommentSection: React.FC<CommentSectionProps> = ({ 
  onCommentAdded,
  onAuthRequired 
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSuccess, showError } = useToast();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const [loadMoreCount, setLoadMoreCount] = useState(5);
  const [showAll, setShowAll] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set());
  const hasLoadedRef = useRef(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const isAuthenticated = !!user;

  const loadComments = useCallback(async () => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    
    try {
      setLoading(true);
      const data = await commentService.getComments();
      const sorted = data.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
      setComments(sorted);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleToggleReplies = (commentId: string) => {
    setCollapsedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleAddReply = async (content: string, parentId: string) => {
    try {
      const comment = await commentService.addComment(content, parentId);
      
      setComments(prev => 
        prev.map((c: CommentWithUser) => {
          if (c.id === parentId) {
            return { ...c, replies: [...(c.replies || []), comment] };
          }
          return c;
        })
      );
    } catch (error) {
      throw error;
    }
  };

  const handleAddComment = async () => {
    if (!isAuthenticated) {
      if (onAuthRequired) onAuthRequired();
      return;
    }

    const trimmedComment = newComment.trim();
    if (!trimmedComment) {
      showError('Comment cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const comment = await commentService.addComment(trimmedComment, null);
      setComments((prev: CommentWithUser[]) => [comment, ...prev]);
      setNewComment('');
      showSuccess('Comment added!');
      if (onCommentAdded) onCommentAdded();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      showError(error?.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await commentService.deleteComment(commentId);
      setComments((prev: CommentWithUser[]) => 
        prev.filter((c: CommentWithUser) => c.id !== commentId).map((c: CommentWithUser) => ({
          ...c,
          replies: c.replies?.filter((r: CommentWithUser) => r.id !== commentId) || [],
        }))
      );
      showSuccess('Comment deleted!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      showError('Failed to delete comment');
    }
  };

  // Updated handleVote with proper vote removal and optimistic updates
  const handleVote = async (commentId: string, voteType: 'like' | 'dislike' | null) => {
    if (!isAuthenticated) {
      if (onAuthRequired) onAuthRequired();
      return;
    }

    try {
      // Call the service to update the vote in database
      await commentService.voteComment(commentId, voteType);
      
      // Update local state optimistically
      setComments((prev: CommentWithUser[]) => 
        prev.map((c: CommentWithUser) => {
          // Check if this is the comment we're voting on
          if (c.id === commentId) {
            const currentVote = c.user_vote;
            let newLikes = c.likes;
            let newDislikes = c.dislikes;
            
            if (currentVote === voteType) {
              // Removing vote (clicked the same button)
              if (voteType === 'like') newLikes--;
              if (voteType === 'dislike') newDislikes--;
              return { 
                ...c, 
                user_vote: null,
                likes: Math.max(0, newLikes),
                dislikes: Math.max(0, newDislikes),
              };
            } else {
              // Changing vote or adding new vote
              if (currentVote === 'like') newLikes--;
              if (currentVote === 'dislike') newDislikes--;
              if (voteType === 'like') newLikes++;
              if (voteType === 'dislike') newDislikes++;
              return { 
                ...c, 
                user_vote: voteType,
                likes: Math.max(0, newLikes),
                dislikes: Math.max(0, newDislikes),
              };
            }
          }
          
          // Also check and update replies
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map((r: CommentWithUser) => {
                if (r.id === commentId) {
                  const currentVote = r.user_vote;
                  let newLikes = r.likes;
                  let newDislikes = r.dislikes;
                  
                  if (currentVote === voteType) {
                    if (voteType === 'like') newLikes--;
                    if (voteType === 'dislike') newDislikes--;
                    return { ...r, user_vote: null, likes: Math.max(0, newLikes), dislikes: Math.max(0, newDislikes) };
                  } else {
                    if (currentVote === 'like') newLikes--;
                    if (currentVote === 'dislike') newDislikes--;
                    if (voteType === 'like') newLikes++;
                    if (voteType === 'dislike') newDislikes++;
                    return { ...r, user_vote: voteType, likes: Math.max(0, newLikes), dislikes: Math.max(0, newDislikes) };
                  }
                }
                return r;
              })
            };
          }
          return c;
        })
      );
    } catch (error: any) {
      console.error('Error voting:', error);
      showError(error?.message || 'Failed to vote');
    }
  };

  const handleLoadMore = () => {
    if (showAll) {
      setVisibleCount(3);
      setShowAll(false);
    } else {
      const newCount = visibleCount + loadMoreCount;
      if (newCount >= comments.length) {
        setVisibleCount(comments.length);
        setShowAll(true);
      } else {
        setVisibleCount(newCount);
      }
    }
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewComment(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  }, [newComment]);

  const getUserAvatar = (): string => {
    if (!user) return '';
    return user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
  };

  const getUserInitials = (): string => {
    if (!user) return 'U';
    const name = user.user_metadata?.full_name || 
                 user.user_metadata?.name || 
                 user.email?.split('@')[0] || 
                 'User';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const avatarUrl = getUserAvatar();
  const initials = getUserInitials();

  const visibleComments = comments.slice(0, visibleCount);
  const hasMore = comments.length > visibleCount;
  const totalComments = comments.length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: isMobile ? 2 : 3, 
      mt: isMobile ? 2 : 3, 
      borderRadius: isMobile ? 2 : 3,
      backgroundColor: 'transparent',
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: isMobile ? 2 : 3,
        flexWrap: 'wrap',
        gap: 1,
      }}>
        <Box>
          <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ 
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
            letterSpacing: '-0.02em',
          }}>
            💬 Discussion
            <Chip 
              label={totalComments} 
              size="small" 
              sx={{ 
                fontWeight: 600,
                height: isMobile ? 20 : 24,
                fontSize: isMobile ? '0.65rem' : '0.75rem',
                backgroundColor: 'primary.main',
                color: '#fff',
                fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          </Typography>
        </Box>
      </Box>

      {isAuthenticated ? (
        <Box sx={{ 
          mb: isMobile ? 2 : 3, 
          p: isMobile ? 1.5 : 2,
          borderRadius: 2,
          bgcolor: 'action.hover',
          display: 'flex',
          gap: isMobile ? 1.5 : 2,
          alignItems: 'flex-start',
          border: '1px solid',
          borderColor: 'transparent',
          transition: 'all 0.2s ease',
          '&:focus-within': {
            borderColor: 'primary.main',
            bgcolor: 'background.paper',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          },
        }}>
          <Avatar 
            src={avatarUrl || undefined}
            sx={{ 
              width: isMobile ? 32 : 40, 
              height: isMobile ? 32 : 40,
              bgcolor: avatarUrl ? 'transparent' : 'primary.main',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '2px solid',
              borderColor: 'background.paper',
            }}
          >
            {!avatarUrl && initials}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              multiline
              rows={1}
              placeholder="What are your thoughts?"
              value={newComment}
              onChange={handleInputChange}
              disabled={isSubmitting}
              variant="standard"
              size="small"
              onKeyDown={handleKeyDown}
              inputRef={inputRef}
              sx={{
                '& .MuiInput-root': {
                  backgroundColor: 'transparent',
                  fontSize: isMobile ? '0.875rem' : '0.9375rem',
                  fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
              <Button
                variant="text"
                size="small"
                onClick={handleAddComment}
                disabled={isSubmitting || !newComment.trim()}
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
                  fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
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
      ) : (
        <Box sx={{ 
          mb: isMobile ? 2 : 3, 
          p: isMobile ? 2 : 3, 
          bgcolor: 'action.hover', 
          borderRadius: 2,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          border: '1px dashed',
          borderColor: 'divider',
        }}>
          <Login sx={{ fontSize: isMobile ? 28 : 36, color: 'text.secondary' }} />
          <Typography variant={isMobile ? 'body2' : 'body1'} color="text.secondary" sx={{
            fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
          }}>
            Login to join the conversation
          </Typography>
          <Button 
            variant="contained" 
            size={isMobile ? "small" : "medium"}
            startIcon={<Login />}
            onClick={onAuthRequired}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
            }}
          >
            Login
          </Button>
        </Box>
        
      )}

      <Divider sx={{ my: isMobile ? 1.5 : 2 }} />

      {comments.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: isMobile ? 3 : 4,
          bgcolor: 'action.hover',
          borderRadius: 2,
        }}>
          <Typography variant="body2" color="text.secondary" sx={{
            fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
          }}>
            No comments yet. Start the conversation!
          </Typography>
        </Box>
      ) : (
        <>
          {visibleComments.map((comment: CommentWithUser) => (
            <SingleComment
              key={comment.id}
              comment={comment}
              onDelete={handleDelete}
              onVote={handleVote}
              onAddReply={handleAddReply}
              depth={0}
              isAuthenticated={isAuthenticated}
              onAuthRequired={() => {
                if (onAuthRequired) onAuthRequired();
              }}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              onToggleReplies={handleToggleReplies}
              showReplies={!collapsedThreads.has(comment.id)}
              maxDepth={2}
            />
          ))}

          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                onClick={handleLoadMore}
                variant="text"
                size="small"
                sx={{ 
                  textTransform: 'none', 
                  color: 'text.secondary',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  fontFamily: 'Inter, Roboto, Open Sans, Segoe UI, sans-serif',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                {showAll ? 'Show less' : `Load ${Math.min(loadMoreCount, comments.length - visibleCount)} more comments`}
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};