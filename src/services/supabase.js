/**
 * Supabase Client Configuration
 * Handles database connection and authentication with session validation
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Create Supabase client with proper session handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'mandarin-tutor-auth',
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-client-info': 'mandarin-tutor'
    }
  }
});

/**
 * Auth Helper Functions
 */

// Sign up new user
export const signUp = async (email, password, displayName, role = 'student') => {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          role: role
        }
      }
    });

    if (authError) throw authError;

    // Profile will be created by database trigger
    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get the created profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.warn('Profile not yet created, using auth data');
    }

    return { 
      user: authData.user, 
      profile: profileData || {
        id: authData.user.id,
        email: email,
        display_name: displayName,
        role: role
      }
    };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

// Sign in existing user
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Update last login
    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id);

    // Get full profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw profileError;

    return { user: data.user, profile, session: data.session };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

// Sign out with cleanup
export const signOut = async () => {
  try {
    // Clear local storage first
    localStorage.removeItem('mandarin-tutor-auth');
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
  } catch (error) {
    console.error('Sign out error:', error);
    // Even if there's an error, clear local state
    localStorage.removeItem('mandarin-tutor-auth');
    throw error;
  }
};

// Get current session with validation
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    // Validate session is not expired
    if (session?.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      if (expiresAt < new Date()) {
        console.log('Session expired, clearing...');
        await signOut();
        return null;
      }
    }
    
    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
};

// Get current user with profile
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;

    if (!user) return null;

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    return { ...user, ...profile };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// Update user profile
export const updateProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

// Update user email
export const updateEmail = async (newEmail) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      email: newEmail
    });

    if (error) throw error;

    // Update profile
    await supabase
      .from('profiles')
      .update({ email: newEmail })
      .eq('id', data.user.id);

    return data;
  } catch (error) {
    console.error('Update email error:', error);
    throw error;
  }
};

// Update password
export const updatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
};

// Request password reset
export const resetPasswordRequest = async (email) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Password reset request error:', error);
    throw error;
  }
};

// Subscribe to auth changes
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event);
    
    if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
      // Ensure local storage is cleared
      localStorage.removeItem('mandarin-tutor-auth');
      callback(event, null, null);
      return;
    }
    
    if (session?.user) {
      try {
        // Get full profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        callback(event, session, profile);
      } catch (err) {
        console.error('Error fetching profile on auth change:', err);
        callback(event, session, null);
      }
    } else {
      callback(event, session, null);
    }
  });
};

/**
 * Realtime Helper Functions
 */

// Subscribe to table changes
export const subscribeToTable = (table, filter, callback) => {
  const channelName = filter ? `${table}-${filter}` : `${table}-changes`;
  
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: filter
      },
      callback
    )
    .subscribe();

  return channel;
};

// Unsubscribe from channel
export const unsubscribe = (channel) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};

/**
 * Storage Helper Functions
 */

// Upload file
export const uploadFile = async (bucket, path, file) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Upload file error:', error);
    throw error;
  }
};

// Get file URL
export const getFileUrl = (bucket, path) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
};

// Delete file
export const deleteFile = async (bucket, path) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  } catch (error) {
    console.error('Delete file error:', error);
    throw error;
  }
};

export default supabase;