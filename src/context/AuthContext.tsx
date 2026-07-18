import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isCreatingProfile = useRef(false);
  const profileCheckedRef = useRef<Set<string>>(new Set());

  const ensureProfileExists = useCallback(async (user: User) => {
    if (profileCheckedRef.current.has(user.id)) {
      console.log('✅ Profile already checked for:', user.email);
      return;
    }

    if (isCreatingProfile.current) {
      console.log('Profile creation already in progress, skipping...');
      return;
    }

    try {
      console.log('🔍 Checking profile for user:', user.email);
      
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking profile:', checkError);
        profileCheckedRef.current.add(user.id);
        return;
      }

      if (existingProfile) {
        console.log('✅ Profile already exists for:', user.email);
        profileCheckedRef.current.add(user.id);
        return;
      }

      console.log('🆕 Creating profile for user:', user.email);
      isCreatingProfile.current = true;

      const email = user.email || '';
      const fullName = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       email.split('@')[0] || 
                       'User';
      const avatarUrl = user.user_metadata?.avatar_url || 
                        user.user_metadata?.picture || 
                        '';

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: email,
          full_name: fullName,
          avatar_url: avatarUrl,
        });

      if (insertError) {
        console.error('❌ Error creating profile:', insertError);
      } else {
        console.log('✅ Profile created successfully for:', email);
      }
      
      profileCheckedRef.current.add(user.id);
    } catch (error) {
      console.error('Error in ensureProfileExists:', error);
      profileCheckedRef.current.add(user.id);
    } finally {
      isCreatingProfile.current = false;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await ensureProfileExists(session.user);
      }
    } catch (error) {
      console.error('Error in refreshSession:', error);
    } finally {
      setLoading(false);
    }
  }, [ensureProfileExists]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await ensureProfileExists(session.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await ensureProfileExists(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        profileCheckedRef.current.clear();
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [ensureProfileExists]);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      
      if (error) {
        console.error('Google sign in error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
      throw error;
    }
  };

  const signInWithFacebook = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin,
        },
      });
      
      if (error) {
        console.error('Facebook sign in error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in signInWithFacebook:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      setSession(null);
      setUser(null);
      profileCheckedRef.current.clear();
    } catch (error) {
      console.error('Error in signOut:', error);
      throw error;
    }
  };

  // Delete Account Function
  const deleteAccount = async () => {
    try {
      const userId = user?.id;
      if (!userId) {
        throw new Error('No user logged in');
      }

      // Call the database function to delete user
      const { error } = await supabase.rpc('delete_user_account', {
        user_id: userId
      });

      if (error) {
        console.error('Delete account error:', error);
        throw error;
      }

      // Sign out after successful deletion
      await signOut();
    } catch (error) {
      console.error('Error in deleteAccount:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading, 
      signInWithGoogle, 
      signInWithFacebook, 
      signOut,
      refreshSession,
      deleteAccount 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};