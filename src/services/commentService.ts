import { supabase } from './supabaseClient';
import { Comment, CommentUser } from '../types/comment';

// Import supabaseAdmin lazily to avoid initialization issues
let supabaseAdmin: any = null;

// Function to get admin client (initialized when needed)
const getAdminClient = async () => {
  if (!supabaseAdmin) {
    const { supabaseAdmin: admin } = await import('./supabaseClient');
    supabaseAdmin = admin;
  }
  return supabaseAdmin;
};

export const commentService = {
  // Get all comments with replies
  async getComments(): Promise<Comment[]> {
    try {
      const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      if (!comments || comments.length === 0) {
        return [];
      }

      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const replies = await this.getReplies(comment.id);
          return { ...comment, replies };
        })
      );

      return commentsWithReplies;
    } catch (error) {
      console.error('Error in getComments:', error);
      return [];
    }
  },

  // Get replies for a specific comment
  async getReplies(parentId: string): Promise<Comment[]> {
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

      return replies || [];
    } catch (error) {
      console.error('Error in getReplies:', error);
      return [];
    }
  },

  // Add a new comment
  async addComment(
    content: string,
    user: CommentUser,
    parentId: string | null = null
  ): Promise<Comment | null> {
    try {
      // Check if user already exists
      const { data: existingUser, error: userError } = await supabase
        .from('comment_users')
        .select('email')
        .eq('email', user.email)
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error checking user:', userError);
      }

      if (!existingUser) {
        const { error: insertUserError } = await supabase
          .from('comment_users')
          .insert({
            email: user.email,
            name: user.is_anonymous ? 'Anonymous' : user.name,
            is_anonymous: user.is_anonymous,
          });

        if (insertUserError) {
          console.error('Error creating user:', insertUserError);
          throw insertUserError;
        }
      }

      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          content: content.trim(),
          user_id: user.email,
          user_name: user.is_anonymous ? 'Anonymous' : user.name,
          user_email: user.email,
          is_anonymous: user.is_anonymous,
          parent_id: parentId,
          likes: 0,
          dislikes: 0,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        throw error;
      }

      return comment as Comment;
    } catch (error) {
      console.error('Error in addComment:', error);
      throw error;
    }
  },

  // Update a comment - Using supabaseAdmin to bypass RLS
  async updateComment(commentId: string, content: string, userEmail: string): Promise<void> {
    try {
      console.log(`🔄 Updating comment ${commentId} for user ${userEmail}`);
      
      // First verify ownership using public client
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('user_email')
        .eq('id', commentId)
        .single();

      if (fetchError) {
        console.error('Error fetching comment:', fetchError);
        throw new Error('Comment not found');
      }

      // Check if the user owns the comment (case-insensitive)
      if (comment.user_email.toLowerCase() !== userEmail.toLowerCase()) {
        console.error(`❌ Permission denied: ${userEmail} does not own comment ${commentId}`);
        throw new Error('You do not have permission to edit this comment');
      }

      // Get admin client
      const admin = await getAdminClient();

      // Use admin client to bypass RLS for the update
      const { error } = await admin
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

      console.log(`✅ Comment ${commentId} updated successfully`);
    } catch (error) {
      console.error('Error in updateComment:', error);
      throw error;
    }
  },

  // Delete a comment and its replies - Using supabaseAdmin to bypass RLS
  async deleteComment(commentId: string, userEmail: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting comment ${commentId} for user ${userEmail}`);
      
      // First verify ownership using public client
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('user_email')
        .eq('id', commentId)
        .single();

      if (fetchError) {
        console.error('Error fetching comment:', fetchError);
        throw new Error('Comment not found');
      }

      // Check if the user owns the comment (case-insensitive)
      if (comment.user_email.toLowerCase() !== userEmail.toLowerCase()) {
        console.error(`❌ Permission denied: ${userEmail} does not own comment ${commentId}`);
        throw new Error('You do not have permission to delete this comment');
      }

      // Get admin client
      const admin = await getAdminClient();

      // Use admin client to bypass RLS for deletion
      // Delete votes first
      await admin
        .from('comment_votes')
        .delete()
        .eq('comment_id', commentId);

      // Delete replies
      await admin
        .from('comments')
        .delete()
        .eq('parent_id', commentId);

      // Delete the comment
      const { error } = await admin
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        throw error;
      }

      console.log(`✅ Comment ${commentId} deleted successfully`);
    } catch (error) {
      console.error('Error in deleteComment:', error);
      throw error;
    }
  },

  // Like or dislike a comment
  async voteComment(commentId: string, userEmail: string, voteType: 'like' | 'dislike' | null): Promise<void> {
    try {
      console.log(`Voting on comment ${commentId}: ${voteType}`);
      
      if (!userEmail) {
        throw new Error('You must be logged in to vote');
      }

      const { data: existingVote, error: fetchError } = await supabase
        .from('comment_votes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_email', userEmail)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching existing vote:', fetchError);
      }

      if (existingVote) {
        if (voteType === null) {
          console.log(`Removing vote from comment ${commentId}`);
          const { error: deleteError } = await supabase
            .from('comment_votes')
            .delete()
            .eq('comment_id', commentId)
            .eq('user_email', userEmail);
            
          if (deleteError) {
            console.error('Error deleting vote:', deleteError);
            throw deleteError;
          }
          console.log(`✅ Vote removed from comment ${commentId}`);
        } else if (existingVote.vote_type !== voteType) {
          console.log(`Updating vote on comment ${commentId} from ${existingVote.vote_type} to ${voteType}`);
          const { error: updateError } = await supabase
            .from('comment_votes')
            .update({ vote_type: voteType })
            .eq('comment_id', commentId)
            .eq('user_email', userEmail);
            
          if (updateError) {
            console.error('Error updating vote:', updateError);
            throw updateError;
          }
          console.log(`✅ Vote updated on comment ${commentId} to ${voteType}`);
        } else {
          console.log(`Vote already ${voteType} on comment ${commentId}`);
        }
      } else if (voteType !== null) {
        console.log(`Adding new ${voteType} to comment ${commentId}`);
        const { error: insertError } = await supabase
          .from('comment_votes')
          .insert({
            comment_id: commentId,
            user_email: userEmail,
            vote_type: voteType,
          });
          
        if (insertError) {
          console.error('Error inserting vote:', insertError);
          throw insertError;
        }
        console.log(`✅ New ${voteType} added to comment ${commentId}`);
      }

      // Update comment vote counts
      await this.updateCommentVoteCount(commentId);
    } catch (error) {
      console.error('Error in voteComment:', error);
      throw error;
    }
  },

  // Update comment vote counts
  async updateCommentVoteCount(commentId: string): Promise<void> {
    try {
      const { count: likeCount, error: likeError } = await supabase
        .from('comment_votes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId)
        .eq('vote_type', 'like');

      if (likeError) {
        console.error('Error counting likes:', likeError);
      }

      const { count: dislikeCount, error: dislikeError } = await supabase
        .from('comment_votes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId)
        .eq('vote_type', 'dislike');

      if (dislikeError) {
        console.error('Error counting dislikes:', dislikeError);
      }

      // Get admin client
      const admin = await getAdminClient();

      const { error: updateError } = await admin
        .from('comments')
        .update({
          likes: likeCount || 0,
          dislikes: dislikeCount || 0,
        })
        .eq('id', commentId);

      if (updateError) {
        console.error('Error updating comment vote counts:', updateError);
        throw updateError;
      }
    } catch (error) {
      console.error('Error in updateCommentVoteCount:', error);
      throw error;
    }
  },

  // Get user's vote on a comment
  async getUserVote(commentId: string, userEmail: string): Promise<'like' | 'dislike' | null> {
    try {
      if (!userEmail) return null;

      const { data: vote, error } = await supabase
        .from('comment_votes')
        .select('vote_type')
        .eq('comment_id', commentId)
        .eq('user_email', userEmail)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user vote:', error);
        return null;
      }

      return vote?.vote_type || null;
    } catch (error) {
      console.error('Error in getUserVote:', error);
      return null;
    }
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<CommentUser | null> {
    try {
      const { data: user, error } = await supabase
        .from('comment_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }

      return user || null;
    } catch (error) {
      console.error('Error in getUserByEmail:', error);
      return null;
    }
  },

  // Update user profile
  async updateUserProfile(email: string, name: string, isAnonymous: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('comment_users')
        .update({
          name: isAnonymous ? 'Anonymous' : name,
          is_anonymous: isAnonymous,
        })
        .eq('email', email);

      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  },

  // Check if user exists
  async userExists(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      return !!user;
    } catch (error) {
      console.error('Error in userExists:', error);
      return false;
    }
  }
};