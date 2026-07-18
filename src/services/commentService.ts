// src/services/commentService.ts

import { supabase } from './supabaseClient';

export interface Comment {
  id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  likes: number;
  dislikes: number;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    user_metadata: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  replies?: Comment[];
  user_vote?: 'like' | 'dislike' | null;
}

export interface CommentWithUser extends Comment {
  user: {
    email: string;
    user_metadata: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  replies?: CommentWithUser[];
  user_vote?: 'like' | 'dislike' | null;
}

export const commentService = {
  // Get all comments with replies
  async getComments(): Promise<CommentWithUser[]> {
    try {
      console.log('Fetching comments...');
      
      // First, fetch all comments without user join
      const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        // Return empty array instead of throwing
        return [];
      }

      console.log(`Fetched ${comments?.length || 0} comments`);

      if (!comments || comments.length === 0) {
        return [];
      }

      // Get all user IDs from comments
      const userIds = [...new Set(comments.map(c => c.user_id))];
      
      // Fetch all user profiles in one query
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', userIds);

      // Create a map of user data
      const userMap = new Map();
      
      if (profiles) {
        profiles.forEach((profile: any) => {
          userMap.set(profile.id, {
            email: profile.email || '',
            user_metadata: {
              full_name: profile.full_name || 'User',
              avatar_url: profile.avatar_url || '',
            }
          });
        });
      }

      // If profiles don't exist, try to get from auth
      if (profileError || !profiles || profiles.length === 0) {
        console.log('No profiles found, using auth data fallback');
        const { data: session } = await supabase.auth.getSession();
        const currentUser = session?.session?.user;
        
        if (currentUser) {
          // Add current user's data if they have comments
          comments.forEach((comment: any) => {
            if (comment.user_id === currentUser.id && !userMap.has(currentUser.id)) {
              userMap.set(currentUser.id, {
                email: currentUser.email || '',
                user_metadata: {
                  full_name: currentUser.user_metadata?.full_name || 
                            currentUser.user_metadata?.name || 
                            'User',
                  avatar_url: currentUser.user_metadata?.avatar_url || '',
                }
              });
            }
          });
        }
      }

      // Get user votes for each comment
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      let voteMap = new Map();
      if (userId) {
        const { data: votes } = await supabase
          .from('comment_votes')
          .select('comment_id, vote_type')
          .eq('user_id', userId);

        votes?.forEach(v => voteMap.set(v.comment_id, v.vote_type));
      }

      // Combine comment data with user data
      const commentsWithUser = comments.map((comment: any) => {
        const userData = userMap.get(comment.user_id) || {
          email: '',
          user_metadata: {
            full_name: 'User',
            avatar_url: '',
          }
        };
        
        return {
          ...comment,
          user: userData,
          user_vote: voteMap.get(comment.id) || null,
          replies: []
        };
      });

      // Get replies for each comment
      for (const comment of commentsWithUser) {
        const replies = await this.getReplies(comment.id);
        comment.replies = replies;
      }

      return commentsWithUser;
    } catch (error) {
      console.error('Error in getComments:', error);
      // Return empty array on error
      return [];
    }
  },

  // Get replies for a specific comment
  async getReplies(parentId: string): Promise<CommentWithUser[]> {
    try {
      const { data: replies, error } = await supabase
        .from('comments')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching replies:', error);
        return [];
      }

      if (!replies || replies.length === 0) {
        return [];
      }

      // Get user IDs from replies
      const userIds = [...new Set(replies.map(r => r.user_id))];
      
      // Fetch user profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', userIds);

      const userMap = new Map();
      if (profiles) {
        profiles.forEach((profile: any) => {
          userMap.set(profile.id, {
            email: profile.email || '',
            user_metadata: {
              full_name: profile.full_name || 'User',
              avatar_url: profile.avatar_url || '',
            }
          });
        });
      }

      // Get user votes
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      let voteMap = new Map();
      if (userId) {
        const replyIds = replies.map(r => r.id);
        const { data: votes } = await supabase
          .from('comment_votes')
          .select('comment_id, vote_type')
          .eq('user_id', userId)
          .in('comment_id', replyIds);

        votes?.forEach(v => voteMap.set(v.comment_id, v.vote_type));
      }

      return replies.map((reply: any) => {
        const userData = userMap.get(reply.user_id) || {
          email: '',
          user_metadata: {
            full_name: 'User',
            avatar_url: '',
          }
        };
        
        return {
          ...reply,
          user: userData,
          user_vote: voteMap.get(reply.id) || null,
        };
      });
    } catch (error) {
      console.error('Error in getReplies:', error);
      return [];
    }
  },

  // Add a new comment
  async addComment(content: string, parentId: string | null = null): Promise<CommentWithUser> {
    try {
      console.log('Adding comment...');
      
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      
      if (!userId) {
        throw new Error('You must be logged in to comment');
      }

      // First, ensure profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!existingProfile) {
        console.log('Creating profile for user...');
        const userData = session?.session?.user;
        await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userData?.email || '',
            full_name: userData?.user_metadata?.full_name || 
                      userData?.user_metadata?.name || 
                      'User',
            avatar_url: userData?.user_metadata?.avatar_url || '',
          });
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: content.trim(),
          user_id: userId,
          parent_id: parentId,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        throw error;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      return {
        ...data,
        user: {
          email: profile?.email || '',
          user_metadata: {
            full_name: profile?.full_name || 'User',
            avatar_url: profile?.avatar_url || '',
          }
        },
        user_vote: null,
        replies: []
      };
    } catch (error) {
      console.error('Error in addComment:', error);
      throw error;
    }
  },

  // Update a comment
  async updateComment(commentId: string, content: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          content: content.trim(), 
          updated_at: new Date().toISOString() 
        })
        .eq('id', commentId);

      if (error) {
        console.error('Error updating comment:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateComment:', error);
      throw error;
    }
  },

  // Delete a comment
  async deleteComment(commentId: string): Promise<void> {
    try {
      // Delete replies first
      await supabase
        .from('comments')
        .delete()
        .eq('parent_id', commentId);

      // Delete the comment itself
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteComment:', error);
      throw error;
    }
  },

  // Like or dislike a comment
  async voteComment(commentId: string, voteType: 'like' | 'dislike' | null): Promise<void> {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      if (!userId) {
        throw new Error('You must be logged in to vote');
      }

      const { data: existingVote } = await supabase
        .from('comment_votes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingVote) {
        if (voteType === null) {
          await supabase
            .from('comment_votes')
            .delete()
            .eq('comment_id', commentId)
            .eq('user_id', userId);
        } else if (existingVote.vote_type !== voteType) {
          await supabase
            .from('comment_votes')
            .update({ vote_type: voteType })
            .eq('comment_id', commentId)
            .eq('user_id', userId);
        }
      } else if (voteType !== null) {
        await supabase
          .from('comment_votes')
          .insert({
            comment_id: commentId,
            user_id: userId,
            vote_type: voteType,
          });
      }
    } catch (error) {
      console.error('Error in voteComment:', error);
      throw error;
    }
  }
};