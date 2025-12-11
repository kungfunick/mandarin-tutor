/**
 * AuthContext - Supabase Authentication
 * Manages user authentication and authorization with real database
 * Fixed version with all helper functions and session validation
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
        await handleLogout();
        return false;
      }

      // Verify session hasn't been revoked by checking with server
      const { data: { user: serverUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !serverUser) {
        console.log('Server session invalid, logging out...');
        await handleLogout();
        return false;
      }

      return true;
    } catch (err) {
      console.error('Session validation error:', err);
      await handleLogout();
      return false;
    }
  }, []);

  // Handle logout (internal function)
  const handleLogout = async () => {
    try {
      // Clear local state first
      setUser(null);
      setProfile(null);
      setAllUsers([]);
      setStudents([]);
      setTeachers([]);
      
      // Clear localStorage
      localStorage.removeItem('mandarin-tutor-auth');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout cleanup error:', err);
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
          await handleLogout();
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
      } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
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

  // Login function
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
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
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

  // Logout function (public)
  const logout = async () => {
    try {
      setError(null);
      await handleLogout();
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
      await loadRoleData(refreshed);
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  };

  // =============================================
  // HELPER FUNCTIONS FOR COMPONENTS
  // =============================================

  // Get students for a teacher
  const getStudents = useCallback((teacherId) => {
    if (!teacherId) return students;
    return allUsers.filter(u => u.teacher_id === teacherId && u.role === 'student');
  }, [allUsers, students]);

  // Get teacher for a student
  const getTeacher = useCallback((teacherId) => {
    if (!teacherId) return null;
    return allUsers.find(u => u.id === teacherId) || teachers.find(t => t.id === teacherId);
  }, [allUsers, teachers]);

  // Get all users (admin only)
  const getAllUsers = useCallback(() => {
    return allUsers;
  }, [allUsers]);

  // Update user (admin only)
  const updateUser = async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Refresh users list
      const users = await fetchAllUsers();
      setAllUsers(users || []);

      return { success: true, user: data };
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
        'api_config'
      ],
      teacher: [
        'view_students',
        'manage_observations',
        'manage_materials',
        'manage_announcements',
        'view_student_progress',
        'view_all_settings'
      ],
      student: [
        'view_own_data',
        'update_own_profile',
        'view_study_guide',
        'view_announcements',
        'view_materials'
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