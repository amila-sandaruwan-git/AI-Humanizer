import { supabase } from './supabaseClient';
import { Comment, CommentUser } from '../types/comment';

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

  // Update a comment
  async updateComment(commentId: string, content: string, userEmail: string): Promise<void> {
    try {
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (comment.user_id !== userEmail) {
        throw new Error('You do not have permission to update this comment');
      }

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

  // Delete a comment and its replies
  async deleteComment(commentId: string, userEmail: string): Promise<void> {
    try {
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (comment.user_id !== userEmail) {
        throw new Error('You do not have permission to delete this comment');
      }

      await supabase
        .from('comments')
        .delete()
        .eq('parent_id', commentId);

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