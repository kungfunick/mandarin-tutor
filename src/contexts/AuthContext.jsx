/**
 * AuthContext - Supabase Authentication - V14
 * UPDATES:
 * - Complete logout with thorough session cleanup
 * - Better error messages for wrong password
 * - Session validation improvements
 * - Profile update support including avatar
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signIn,
  signOut,
  signUp,
  getCurrentUser,
  getSession,
  updateProfile,
  updateEmail,
  resetPasswordRequest,
  onAuthStateChange,
  supabase
} from '../services/supabase';
import { getUserById, getStudentsByTeacher, getAllUsers as fetchAllUsers, getAllTeachers } from '../services/database';

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
  const [allUsers, setAllUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Validate session is still active on server
  const validateSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('Session invalid or expired, logging out...');
        await performCompleteLogout();
        return false;
      }

      // Verify session hasn't been revoked by checking with server
      const { data: { user: serverUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !serverUser) {
        console.log('Server session invalid, logging out...');
        await performCompleteLogout();
        return false;
      }

      return true;
    } catch (err) {
      console.error('Session validation error:', err);
      await performCompleteLogout();
      return false;
    }
  }, []);

  // Thorough logout that clears everything
  const performCompleteLogout = async () => {
    try {
      console.log('Performing complete logout...');
      
      // 1. Clear React state first
      setUser(null);
      setProfile(null);
      setAllUsers([]);
      setStudents([]);
      setTeachers([]);
      setError(null);
      
      // 2. Clear Supabase session
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (e) {
        console.warn('Supabase signOut error (continuing cleanup):', e);
      }
      
      // 3. Clear ALL localStorage items related to the app
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Remove auth-related and app-specific items
        if (key && (
          key.includes('supabase') ||
          key.includes('mandarin') ||
          key.includes('auth') ||
          key.includes('sb-') ||
          key === 'showDebugUI' ||
          key === 'aiProvider' ||
          key === 'difficulty' ||
          key === 'showTranslations' ||
          key === 'conversationHistory' ||
          key === 'correctionMode' ||
          key === 'theme' ||
          key === 'voiceGender'
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove ${key}:`, e);
        }
      });
      
      // 4. Clear sessionStorage
      try {
        sessionStorage.clear();
      } catch (e) {
        console.warn('SessionStorage clear error:', e);
      }
      
      // 5. Clear any IndexedDB data (Supabase uses this)
      try {
        const databases = await indexedDB.databases?.();
        if (databases) {
          for (const db of databases) {
            if (db.name && (db.name.includes('supabase') || db.name.includes('sb-'))) {
              indexedDB.deleteDatabase(db.name);
            }
          }
        }
      } catch (e) {
        console.warn('IndexedDB cleanup error:', e);
      }
      
      console.log('Complete logout finished');
      
      // 6. Force page reload to ensure clean state
      // Small delay to ensure cleanup completes
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
    } catch (err) {
      console.error('Logout cleanup error:', err);
      // Force reload even on error
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  // Load related data based on role
  const loadRoleData = useCallback(async (userProfile) => {
    if (!userProfile) return;

    try {
      if (userProfile.role === 'admin') {
        // Admins see all users
        const users = await fetchAllUsers();
        setAllUsers(users || []);
        const teacherList = await getAllTeachers();
        setTeachers(teacherList || []);
      } else if (userProfile.role === 'teacher') {
        // Teachers see their students
        const studentList = await getStudentsByTeacher(userProfile.id);
        setStudents(studentList || []);
      }
    } catch (err) {
      console.error('Error loading role data:', err);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Check for existing session
        const session = await getSession();
        
        if (session?.user) {
          // Validate session is still active
          const isValid = await validateSession();
          
          if (isValid && mounted) {
            const currentUser = await getCurrentUser();
            if (currentUser && mounted) {
              setUser(currentUser);
              setProfile(currentUser);
              await loadRoleData(currentUser);
            }
          }
        }
      } catch (err) {
        console.error('Init auth error:', err);
        if (mounted) {
          setError(err.message);
          await performCompleteLogout();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Subscribe to auth changes
    const { data: authListener } = onAuthStateChange(async (event, session, userProfile) => {
      if (!mounted) return;

      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setProfile(userProfile);
        await loadRoleData(userProfile);
      } else if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        setUser(null);
        setProfile(null);
        setAllUsers([]);
        setStudents([]);
        setTeachers([]);
      } else if (event === 'USER_UPDATED' && session?.user) {
        const updated = await getCurrentUser();
        if (updated && mounted) {
          setUser(updated);
          setProfile(updated);
        }
      }
    });

    // Periodic session validation (every 5 minutes)
    const sessionCheckInterval = setInterval(async () => {
      if (user) {
        await validateSession();
      }
    }, 5 * 60 * 1000);

    // Validate session on window focus
    const handleFocus = async () => {
      if (user) {
        await validateSession();
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
      clearInterval(sessionCheckInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [validateSession, loadRoleData]);

  // Login function with better error messages
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const { user: authUser, profile: userProfile } = await signIn(email, password);
      setUser(authUser);
      setProfile(userProfile);
      await loadRoleData(userProfile);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      
      // Parse error message for better user feedback
      let errorMessage = 'Login failed';
      const errMsg = err.message?.toLowerCase() || '';
      
      if (errMsg.includes('invalid login credentials') || 
          errMsg.includes('invalid email or password') ||
          errMsg.includes('invalid_credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (errMsg.includes('email not confirmed')) {
        errorMessage = 'Please confirm your email address before logging in.';
      } else if (errMsg.includes('too many requests') || errMsg.includes('rate limit')) {
        errorMessage = 'Too many login attempts. Please wait a moment and try again.';
      } else if (errMsg.includes('network') || errMsg.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (errMsg.includes('user not found')) {
        errorMessage = 'No account found with this email address.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
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
      
      let errorMessage = 'Registration failed';
      const errMsg = err.message?.toLowerCase() || '';
      
      if (errMsg.includes('already registered') || errMsg.includes('already exists')) {
        errorMessage = 'An account with this email already exists.';
      } else if (errMsg.includes('password') && errMsg.includes('weak')) {
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (errMsg.includes('invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function (public)
  const logout = async () => {
    try {
      setError(null);
      await performCompleteLogout();
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      // Even on error, force logout
      await performCompleteLogout();
      return { success: true }; // Return success anyway since we're forcing logout
    }
  };

  // Update user profile (including avatar)
  const updateUserProfile = async (updates) => {
    try {
      setError(null);
      const updated = await updateProfile(user.id, updates);
      setProfile(prev => ({ ...prev, ...updated }));
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
      console.error('Password reset error:', err);
      const errorMessage = err.message || 'Password reset failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setProfile(currentUser);
        await loadRoleData(currentUser);
      }
      return { success: true };
    } catch (err) {
      console.error('Refresh user error:', err);
      return { success: false, error: err.message };
    }
  };

  // Get all users (admin only)
  const getAllUsers = async () => {
    try {
      const users = await fetchAllUsers();
      setAllUsers(users || []);
      return users;
    } catch (err) {
      console.error('Get all users error:', err);
      return [];
    }
  };

  // Get students for teacher
  const getStudents = async () => {
    if (profile?.role !== 'teacher') return [];
    try {
      const studentList = await getStudentsByTeacher(profile.id);
      setStudents(studentList || []);
      return studentList;
    } catch (err) {
      console.error('Get students error:', err);
      return [];
    }
  };

  // Get teacher for student
  const getTeacher = async () => {
    if (!profile?.teacher_id) return null;
    try {
      return await getUserById(profile.teacher_id);
    } catch (err) {
      console.error('Get teacher error:', err);
      return null;
    }
  };

  // Update user (admin or self)
  const updateUser = async (userId, updates) => {
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

      // Refresh users list
      const users = await fetchAllUsers();
      setAllUsers(users || []);

      return { success: true, profile: data };
    } catch (err) {
      console.error('Update user error:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete user (admin only)
  const deleteUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Refresh users list
      const users = await fetchAllUsers();
      setAllUsers(users || []);

      return { success: true };
    } catch (err) {
      console.error('Delete user error:', err);
      return { success: false, error: err.message };
    }
  };

  // Reset password for user (admin only)
  const resetPassword = async (email) => {
    try {
      await resetPasswordRequest(email);
      return { success: true };
    } catch (err) {
      console.error('Reset password error:', err);
      return { success: false, error: err.message };
    }
  };

  // Update permissions (admin only)
  const updatePermissions = async (userId, role) => {
    return updateUser(userId, { role });
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
        'manage_system',
        'reset_passwords',
        'view_debug',
        'api_config',
        'toggle_registration',
        'toggle_debug'
      ],
      teacher: [
        'view_students',
        'manage_observations',
        'manage_materials',
        'manage_announcements',
        'view_student_progress',
        'create_groups'
      ],
      student: [
        'view_own_data',
        'update_own_profile',
        'view_study_guide',
        'view_announcements',
        'view_materials',
        'practice_chat'
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

    // User management (admin)
    getAllUsers,
    getStudents,
    getTeacher,
    updateUser,
    deleteUser,
    resetPassword,
    updatePermissions,

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
