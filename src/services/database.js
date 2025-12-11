/**
 * Database Operations Service
 * All CRUD operations for Mandarin Tutor
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
    return data;
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get user by ID error:', error);
    throw error;
  }
};

// Get students by teacher ID
export const getStudentsByTeacher = async (teacherId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('role', 'student')
      .order('display_name');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get students by teacher error:', error);
    throw error;
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
    return data;
  } catch (error) {
    console.error('Get all teachers error:', error);
    throw error;
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
  try {
    const { data, error } = await supabase
      .from('study_guides')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  } catch (error) {
    console.error('Get study guide error:', error);
    throw error;
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
      .single();

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

// Get observations for student
export const getObservationsByStudent = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('observations')
      .select('*, teacher:teacher_id(display_name)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get observations error:', error);
    throw error;
  }
};

// Add observation
export const addObservation = async (studentId, teacherId, text) => {
  try {
    const { data, error } = await supabase
      .from('observations')
      .insert([{
        student_id: studentId,
        teacher_id: teacherId,
        text: text
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

// Get materials for student (global + assigned)
export const getMaterialsForStudent = async (studentId, teacherId) => {
  try {
    const { data, error } = await supabase
      .from('learning_materials')
      .select('*, teacher:teacher_id(display_name)')
      .or(`is_global.eq.true,student_ids.cs.{${studentId}}`)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get materials for student error:', error);
    throw error;
  }
};

// Get all materials by teacher
export const getMaterialsByTeacher = async (teacherId) => {
  try {
    const { data, error } = await supabase
      .from('learning_materials')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get materials by teacher error:', error);
    throw error;
  }
};

// Add learning material
export const addLearningMaterial = async (materialData) => {
  try {
    const { data, error } = await supabase
      .from('learning_materials')
      .insert([materialData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Add learning material error:', error);
    throw error;
  }
};

// Update learning material
export const updateLearningMaterial = async (materialId, updates) => {
  try {
    const { data, error } = await supabase
      .from('learning_materials')
      .update(updates)
      .eq('id', materialId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Update learning material error:', error);
    throw error;
  }
};

// Delete learning material
export const deleteLearningMaterial = async (materialId) => {
  try {
    const { error } = await supabase
      .from('learning_materials')
      .delete()
      .eq('id', materialId);

    if (error) throw error;
  } catch (error) {
    console.error('Delete learning material error:', error);
    throw error;
  }
};

/**
 * AREAS TO IMPROVE
 */

// Get improvements for student
export const getImprovementsByStudent = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('areas_to_improve')
      .select('*, teacher:teacher_id(display_name)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get improvements error:', error);
    throw error;
  }
};

// Add improvement area
export const addImprovementArea = async (improvementData) => {
  try {
    const { data, error } = await supabase
      .from('areas_to_improve')
      .insert([improvementData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Add improvement area error:', error);
    throw error;
  }
};

// Delete improvement area
export const deleteImprovementArea = async (improvementId) => {
  try {
    const { error } = await supabase
      .from('areas_to_improve')
      .delete()
      .eq('id', improvementId);

    if (error) throw error;
  } catch (error) {
    console.error('Delete improvement area error:', error);
    throw error;
  }
};

/**
 * ANNOUNCEMENTS
 */

// Get announcements for student (global from their teacher)
export const getAnnouncementsForStudent = async (teacherId) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, teacher:teacher_id(display_name)')
      .eq('teacher_id', teacherId)
      .eq('is_global', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get announcements for student error:', error);
    throw error;
  }
};

// Get announcements by teacher
export const getAnnouncementsByTeacher = async (teacherId) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get announcements by teacher error:', error);
    throw error;
  }
};

// Add announcement
export const addAnnouncement = async (announcementData) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .insert([announcementData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Add announcement error:', error);
    throw error;
  }
};

// Delete announcement
export const deleteAnnouncement = async (announcementId) => {
  try {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);

    if (error) throw error;
  } catch (error) {
    console.error('Delete announcement error:', error);
    throw error;
  }
};

/**
 * CONVERSATIONS
 */

// Get conversations by user
export const getConversationsByUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get conversations error:', error);
    throw error;
  }
};

// Save conversation
export const saveConversation = async (userId, messages, title) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert([{
        user_id: userId,
        messages: messages,
        title: title
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
 * STATISTICS (for Admin Dashboard)
 */

// Get system statistics
export const getSystemStats = async () => {
  try {
    // Get user counts
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('role, is_active');

    if (usersError) throw usersError;

    // Get database size (estimate from row counts)
    const { count: conversationsCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    const { count: materialsCount } = await supabase
      .from('learning_materials')
      .select('*', { count: 'exact', head: true });

    // Calculate stats
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active).length;
    const admins = users.filter(u => u.role === 'admin').length;
    const teachers = users.filter(u => u.role === 'teacher').length;
    const students = users.filter(u => u.role === 'student').length;

    return {
      totalUsers,
      activeUsers,
      admins,
      teachers,
      students,
      conversations: conversationsCount,
      materials: materialsCount,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Get system stats error:', error);
    throw error;
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
    return data;
  } catch (error) {
    console.error('Get user activity error:', error);
    throw error;
  }
};
