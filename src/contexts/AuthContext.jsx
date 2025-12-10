/**
 * Authentication Context
 * Handles user login, roles, and permissions
 */

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Mock user database (replace with real backend in production)
const MOCK_USERS = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123', // In production, use hashed passwords!
    role: 'admin',
    name: 'Admin User',
    email: 'admin@mandarintutor.com'
  },
  {
    id: '2',
    username: 'teacher1',
    password: 'teacher123',
    role: 'teacher',
    name: 'Teacher Liwen',
    email: 'liwen@mandarintutor.com',
    students: ['3', '4'] // IDs of assigned students
  },
  {
    id: '3',
    username: 'student1',
    password: 'student123',
    role: 'student',
    name: 'Student Wang',
    email: 'wang@mandarintutor.com',
    teacherId: '2' // Assigned teacher
  },
  {
    id: '4',
    username: 'student2',
    password: 'student123',
    role: 'student',
    name: 'Student Li',
    email: 'li@mandarintutor.com',
    teacherId: '2'
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Error loading saved session:', e);
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    // Find user in mock database
    const foundUser = MOCK_USERS.find(
      u => u.username === username && u.password === password
    );

    if (!foundUser) {
      throw new Error('Invalid username or password');
    }

    // Remove password from stored user
    const { password: _, ...userWithoutPassword } = foundUser;

    setUser(userWithoutPassword);
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));

    return userWithoutPassword;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  // Permission helpers
  const hasPermission = (permission) => {
    if (!user) return false;

    const permissions = {
      admin: {
        canAccessDebug: true,
        canConfigureAPI: true,
        canViewAllUsers: true,
        canManageStudyGuides: true,
        canViewAllChats: true,
        canChangeAllSettings: true,
        canAssignTeachers: true
      },
      teacher: {
        canAccessDebug: false,
        canConfigureAPI: false,
        canViewAllUsers: false,
        canManageStudyGuides: true,
        canViewAllChats: false, // Only assigned students
        canChangeAllSettings: true,
        canAssignTeachers: false,
        canViewStudents: true,
        canCreateStudyGuides: true
      },
      student: {
        canAccessDebug: false,
        canConfigureAPI: false,
        canViewAllUsers: false,
        canManageStudyGuides: false,
        canViewAllChats: false, // Only own
        canChangeAllSettings: false,
        canChangeMicSettings: true,
        canChangeVoiceSettings: true,
        canViewOwnStudyGuide: true
      }
    };

    return permissions[user.role]?.[permission] || false;
  };

  const getTeacher = (teacherId) => {
    return MOCK_USERS.find(u => u.id === teacherId && u.role === 'teacher');
  };

  const getStudents = (teacherId) => {
    return MOCK_USERS.filter(u => u.teacherId === teacherId);
  };

  const getAllUsers = () => {
    if (user?.role !== 'admin') return [];
    return MOCK_USERS.map(({ password, ...user }) => user);
  };

  // Admin functions
  const updateUser = (userId, updates) => {
    if (user?.role !== 'admin') return false;
    // In production, this would update the database
    console.log('Update user:', userId, updates);
    return true;
  };

  const deleteUser = (userId) => {
    if (user?.role !== 'admin') return false;
    // In production, this would delete from database
    console.log('Delete user:', userId);
    return true;
  };

  const resetPassword = (userId, newPassword) => {
    if (user?.role !== 'admin') return false;
    // In production, this would hash and update password
    console.log('Reset password for:', userId);
    return true;
  };

  const updatePermissions = (userId, permissions) => {
    if (user?.role !== 'admin') return false;
    // In production, this would update user permissions
    console.log('Update permissions:', userId, permissions);
    return true;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    hasPermission,
    getTeacher,
    getStudents,
    getAllUsers,
    updateUser,
    deleteUser,
    resetPassword,
    updatePermissions,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;