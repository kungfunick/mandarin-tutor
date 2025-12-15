/**
 * Database Operations Service - V14
 * All CRUD operations for Mandarin Tutor
 * UPDATES:
 * - Fixed getUserById to use maybeSingle() to prevent errors when no user found
 * - Added better error handling for empty results
 */

import { supabase } from './supabase';

/**
 * PROFILES / USERS
 */

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
};

// Get user by ID - uses maybeSingle() to handle missing users gracefully
export const getUserById = async (userId) => {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // Changed from .single() - returns null instead of error if not found

    if (error) throw error;
    return data; // Will be null if not found
  } catch (error) {
    console.error('Get user by ID error:', error);
    return null; // Return null instead of throwing to prevent cascading errors
  }
};

// Get students by teacher ID
export const getStudentsByTeacher = async (teacherId) => {
  if (!teacherId) return [];
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('role', 'student')
      .order('display_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get students by teacher error:', error);
    return []; // Return empty array instead of throwing
  }
};

// Get all teachers (for admin)
export const getAllTeachers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'teacher')
      .order('display_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get all teachers error:', error);
    return [];
  }
};

// Create user (admin only)
export const createUser = async (userData) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
};

// Update user (admin or self)
export const updateUser = async (userId, updates) => {
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
    console.error('Update user error:', error);
    throw error;
  }
};

// Delete user (admin only)
export const deleteUser = async (userId) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
};

// Assign student to teacher
export const assignStudentToTeacher = async (studentId, teacherId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ teacher_id: teacherId })
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Assign student error:', error);
    throw error;
  }
};

/**
 * STUDY GUIDES
 */

// Get study guide by user ID
export const getStudyGuide = async (userId) => {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('study_guides')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Changed from .single()

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Get study guide error:', error);
    return null;
  }
};

// Create or update study guide
export const upsertStudyGuide = async (userId, guideData) => {
  try {
    const { data, error } = await supabase
      .from('study_guides')
      .upsert([{
        user_id: userId,
        ...guideData,
        updated_at: new Date().toISOString()
      }], {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Upsert study guide error:', error);
    throw error;
  }
};

// Update study guide stats
export const updateStudyGuideStats = async (userId, stats) => {
  try {
    const { data, error } = await supabase
      .from('study_guides')
      .update({
        ...stats,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Update study guide stats error:', error);
    throw error;
  }
};

/**
 * OBSERVATIONS
 */

// Get observations for a student
export const getObservationsByStudent = async (studentId) => {
  if (!studentId) return [];
  
  try {
    const { data, error } = await supabase
      .from('observations')
      .select('*, teacher:profiles!observations_teacher_id_fkey(display_name, email)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get observations error:', error);
    return [];
  }
};

// Add observation
export const addObservation = async (teacherId, studentId, content, type = 'note') => {
  try {
    const { data, error } = await supabase
      .from('observations')
      .insert([{
        teacher_id: teacherId,
        student_id: studentId,
        content,
        type
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Add observation error:', error);
    throw error;
  }
};

// Delete observation
export const deleteObservation = async (observationId) => {
  try {
    const { error } = await supabase
      .from('observations')
      .delete()
      .eq('id', observationId);

    if (error) throw error;
  } catch (error) {
    console.error('Delete observation error:', error);
    throw error;
  }
};

/**
 * LEARNING MATERIALS
 */

// Get materials for a student
export const getMaterialsForStudent = async (studentId) => {
  if (!studentId) return [];
  
  try {
    // Get materials assigned to this student OR global materials
    const { data, error } = await supabase
      .from('learning_materials')
      .select('*')
      .or(`student_id.eq.${studentId},is_global.is.true`)
      .order('created_at', { ascending: false });

    if (error) {
      // If the or filter fails, try a simpler approach
      console.warn('Materials query failed, trying fallback:', error);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('learning_materials')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      
      if (fallbackError) throw fallbackError;
      return fallbackData || [];
    }
    return data || [];
  } catch (error) {
    console.error('Get materials error:', error);
    return [];
  }
};

// Add material
export const addMaterial = async (teacherId, material) => {
  try {
    const { data, error } = await supabase
      .from('learning_materials')
      .insert([{
        teacher_id: teacherId,
        ...material
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Add material error:', error);
    throw error;
  }
};

// Delete material
export const deleteMaterial = async (materialId) => {
  try {
    const { error } = await supabase
      .from('learning_materials')
      .delete()
      .eq('id', materialId);

    if (error) throw error;
  } catch (error) {
    console.error('Delete material error:', error);
    throw error;
  }
};

/**
 * AREAS TO IMPROVE
 */

// Get improvements for a student
export const getImprovementsByStudent = async (studentId) => {
  if (!studentId) return [];
  
  try {
    const { data, error } = await supabase
      .from('areas_to_improve')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get improvements error:', error);
    return [];
  }
};

// Add improvement
export const addImprovement = async (teacherId, studentId, content) => {
  try {
    const { data, error } = await supabase
      .from('areas_to_improve')
      .insert([{
        teacher_id: teacherId,
        student_id: studentId,
        content
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Add improvement error:', error);
    throw error;
  }
};

/**
 * ANNOUNCEMENTS
 */

// Get announcements for a student
export const getAnnouncementsForStudent = async (studentId) => {
  if (!studentId) return [];
  
  try {
    // Get global announcements and those for this student
    const { data, error } = await supabase
      .from('announcements')
      .select('*, teacher:profiles!announcements_teacher_id_fkey(display_name)')
      .or(`is_global.is.true,student_id.eq.${studentId}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      // If the or filter fails, try getting just global announcements
      console.warn('Announcements query failed, trying fallback:', error);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('announcements')
        .select('*, teacher:profiles!announcements_teacher_id_fkey(display_name)')
        .eq('is_global', true)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (fallbackError) throw fallbackError;
      return fallbackData || [];
    }
    return data || [];
  } catch (error) {
    console.error('Get announcements error:', error);
    return [];
  }
};

// Add announcement
export const addAnnouncement = async (teacherId, content, options = {}) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .insert([{
        teacher_id: teacherId,
        content,
        is_global: options.isGlobal || false,
        student_id: options.studentId || null,
        priority: options.priority || 'normal'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Add announcement error:', error);
    throw error;
  }
};

/**
 * CONVERSATIONS
 */

// Get conversations for user
export const getConversations = async (userId) => {
  if (!userId) return [];
  
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get conversations error:', error);
    return [];
  }
};

// Save conversation
export const saveConversation = async (userId, messages, title) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert([{
        user_id: userId,
        messages,
        title: title || `Conversation ${new Date().toLocaleDateString()}`
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Save conversation error:', error);
    throw error;
  }
};

// Delete conversation
export const deleteConversation = async (conversationId) => {
  try {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  } catch (error) {
    console.error('Delete conversation error:', error);
    throw error;
  }
};

/**
 * TEACHER GROUPS
 */

// Get groups for teacher
export const getTeacherGroups = async (teacherId) => {
  if (!teacherId) return [];
  
  try {
    const { data, error } = await supabase
      .from('teacher_groups')
      .select(`
        *,
        members:group_members(
          student:profiles(id, display_name, email)
        )
      `)
      .eq('teacher_id', teacherId)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get teacher groups error:', error);
    return [];
  }
};

// Create group
export const createGroup = async (teacherId, name, description = '') => {
  try {
    const { data, error } = await supabase
      .from('teacher_groups')
      .insert([{
        teacher_id: teacherId,
        name,
        description
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Create group error:', error);
    throw error;
  }
};

// Add student to group
export const addStudentToGroup = async (groupId, studentId) => {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .insert([{
        group_id: groupId,
        student_id: studentId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Add student to group error:', error);
    throw error;
  }
};

// Remove student from group
export const removeStudentFromGroup = async (groupId, studentId) => {
  try {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('student_id', studentId);

    if (error) throw error;
  } catch (error) {
    console.error('Remove student from group error:', error);
    throw error;
  }
};

/**
 * STATISTICS (for Admin Dashboard)
 */

// Get system statistics
export const getSystemStats = async () => {
  try {
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('role, is_active');

    if (usersError) throw usersError;

    const { count: conversationsCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    const { count: materialsCount } = await supabase
      .from('learning_materials')
      .select('*', { count: 'exact', head: true });

    const usersList = users || [];
    const totalUsers = usersList.length;
    const activeUsers = usersList.filter(u => u.is_active !== false).length;
    const admins = usersList.filter(u => u.role === 'admin').length;
    const teachers = usersList.filter(u => u.role === 'teacher').length;
    const students = usersList.filter(u => u.role === 'student').length;

    return {
      totalUsers,
      activeUsers,
      admins,
      teachers,
      students,
      conversations: conversationsCount || 0,
      materials: materialsCount || 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Get system stats error:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      admins: 0,
      teachers: 0,
      students: 0,
      conversations: 0,
      materials: 0,
      timestamp: new Date().toISOString()
    };
  }
};

// Get user activity (last 7 days)
export const getUserActivity = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('profiles')
      .select('last_login, created_at')
      .gte('last_login', sevenDaysAgo.toISOString());

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get user activity error:', error);
    return [];
  }
};
