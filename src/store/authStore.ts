import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '../types/database.types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  signUpSuccess: boolean;
  setUser: (user: User | null) => void;
  clearSignUpSuccess: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, locationData?: { ville?: string; code_postal?: string; pays?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  initialized: false,
  signUpSuccess: false,

  setUser: (user) => set({ user }),
  
  clearSignUpSuccess: () => set({ signUpSuccess: false }),

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user profile data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user?.id)
        .single();

      if (userError) {
        // If user profile doesn't exist, sign out the authenticated user
        if (userError.code === 'PGRST116') {
          await supabase.auth.signOut();
          throw new Error('Your account setup is incomplete. Please try signing up again or contact support if this issue persists.');
        }
        throw userError;
      }

      set({ user: userData as User, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false 
      });
    }
  },

  signUp: async (email, password, username, locationData = {}) => {
    set({ isLoading: true, error: null });
    try {
      // First check if user already exists in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        // If user already exists, try to create their profile if it's missing
        if (authError.message?.includes('User already registered')) {
          // Try to sign in to get the user ID
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            throw new Error('An account with this email already exists. Please sign in instead.');
          }

          // Check if profile exists
          const { data: existingProfile, error: profileCheckError } = await supabase
            .from('users')
            .select('id')
            .eq('id', signInData.user?.id)
            .single();

          if (profileCheckError && profileCheckError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const { error: profileError } = await supabase
              .from('users')
              .insert({
                id: signInData.user?.id,
                email,
                username,
                ville: locationData.ville || null,
                code_postal: locationData.code_postal || null,
                pays: locationData.pays || null,
                created_at: new Date().toISOString(),
              });

            if (profileError) {
              // Sign out the user since profile creation failed
              await supabase.auth.signOut();
              throw new Error('Failed to complete account setup. Please try again.');
            }

            // Get the created profile
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', signInData.user?.id)
              .single();

            if (userError) {
              await supabase.auth.signOut();
              throw new Error('Failed to retrieve account information. Please try again.');
            }

            set({ user: userData as User, isLoading: false });
            return;
          } else if (!profileCheckError) {
            // Profile exists, user should sign in instead
            await supabase.auth.signOut();
            throw new Error('An account with this email already exists. Please sign in instead.');
          } else {
            // Other profile check error
            await supabase.auth.signOut();
            throw profileCheckError;
          }
        } else {
          throw authError;
        }
      }

      // New user signup - create profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            username,
            ville: locationData.ville || null,
            code_postal: locationData.code_postal || null,
            pays: locationData.pays || null,
            created_at: new Date().toISOString(),
          });

        if (profileError) {
          // If profile creation fails, clean up by signing out
          await supabase.auth.signOut();
          throw new Error('Failed to complete account setup. Please try again.');
        }
      }

      // Set success state with a special flag to indicate successful signup
      set({ isLoading: false, signUpSuccess: true });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false 
      });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false 
      });
    }
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      // Check for existing session
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        // Get user profile data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        if (userError) {
          // If user profile doesn't exist, sign out the authenticated user
          if (userError.code === 'PGRST116') {
            await supabase.auth.signOut();
            set({ user: null });
            return;
          }
          throw userError;
        }

        set({ user: userData as User });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      set({ isLoading: false, initialized: true });
    }
  },
}));