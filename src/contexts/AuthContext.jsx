/**
 * AuthContext - Supabase Authentication
 * Manages user authentication and authorization with real database
 */

import { createContext, useContext, useState, useEffect } from 'react';
import {
  signIn,
  signOut,
  signUp,
  getCurrentUser,
  getSession,
  updateProfile,
  updateEmail,
  resetPasswordRequest,
  onAuthStateChange
} from '../services/supabase';
import { getUserById } from '../services/database';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    // Check for existing session
    const initAuth = async () => {
      try {
        const session = await getSession();
        if (session?.user) {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          setProfile(currentUser);
        }
      } catch (err) {
        console.error('Init auth error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const { data: authListener } = onAuthStateChange(async (event, session, profile) => {
      if (event === 'SIGNED_IN') {
        setUser(session.user);
        setProfile(profile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      } else if (event === 'USER_UPDATED') {
        const updated = await getCurrentUser();
        setUser(updated);
        setProfile(updated);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const { user: authUser, profile: userProfile } = await signIn(email, password);
      setUser(authUser);
      setProfile(userProfile);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (email, password, displayName, role = 'student') => {
    try {
      setError(null);
      setLoading(true);
      const { user: authUser, profile: userProfile } = await signUp(
        email,
        password,
        displayName,
        role
      );
      setUser(authUser);
      setProfile(userProfile);
      return { success: true };
    } catch (err) {
      console.error('Register error:', err);
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setError(null);
      await signOut();
      setUser(null);
      setProfile(null);
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      const errorMessage = err.message || 'Logout failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      setError(null);
      const updated = await updateProfile(user.id, updates);
      setProfile(updated);
      return { success: true, profile: updated };
    } catch (err) {
      console.error('Update profile error:', err);
      const errorMessage = err.message || 'Update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update email
  const updateUserEmail = async (newEmail) => {
    try {
      setError(null);
      await updateEmail(newEmail);
      // Profile will be updated via auth state change
      return { success: true };
    } catch (err) {
      console.error('Update email error:', err);
      const errorMessage = err.message || 'Email update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Request password reset
  const requestPasswordReset = async (email) => {
    try {
      setError(null);
      await resetPasswordRequest(email);
      return { success: true };
    } catch (err) {
      console.error('Password reset request error:', err);
      const errorMessage = err.message || 'Password reset request failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      if (!user?.id) return;
      const refreshed = await getUserById(user.id);
      setProfile(refreshed);
      setUser({ ...user, ...refreshed });
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  };

  // Check permissions
  const hasRole = (role) => {
    return profile?.role === role;
  };

  const isAdmin = () => hasRole('admin');
  const isTeacher = () => hasRole('teacher');
  const isStudent = () => hasRole('student');

  const can = (action) => {
    const role = profile?.role;

    const permissions = {
      admin: [
        'manage_users',
        'view_all_data',
        'delete_users',
        'assign_teachers',
        'manage_system'
      ],
      teacher: [
        'view_students',
        'manage_observations',
        'manage_materials',
        'manage_announcements',
        'view_student_progress'
      ],
      student: [
        'view_own_data',
        'update_own_profile',
        'view_study_guide'
      ]
    };

    return permissions[role]?.includes(action) || false;
  };

  const value = {
    // State
    user,
    profile,
    loading,
    error,

    // Auth functions
    login,
    register,
    logout,

    // Profile functions
    updateUserProfile,
    updateUserEmail,
    requestPasswordReset,
    refreshUser,

    // Permission checks
    hasRole,
    isAdmin,
    isTeacher,
    isStudent,
    can,

    // Computed values
    isAuthenticated: !!user,
    userId: user?.id,
    userEmail: profile?.email,
    displayName: profile?.display_name,
    role: profile?.role,
    teacherId: profile?.teacher_id
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;