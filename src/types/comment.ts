export interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  is_anonymous: boolean;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

export interface CommentUser {
  email: string;
  name: string;
  is_anonymous: boolean;
}