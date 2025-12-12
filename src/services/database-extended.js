/**
 * Database Operations Service - Extended
 * Additional CRUD operations for groups, progress tracking, and batch operations
 * Add these functions to your existing database.js file
 */

import { supabase } from './supabase';

// =============================================
// TEACHER GROUPS
// =============================================

/**
 * Get all groups for a teacher
 */
export const getTeacherGroups = async (teacherId) => {
  try {
    const { data, error } = await supabase
      .from('teacher_groups')
      .select(`
        *,
        group_members (
          student_id,
          student:profiles (
            id,
            email,
            display_name
          )
        )
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform to include student array
    return (data || []).map(group => ({
      ...group,
      students: group.group_members?.map(gm => gm.student) || [],
      studentIds: group.group_members?.map(gm => gm.student_id) || []
    }));
  } catch (error) {
    console.error('Get teacher groups error:', error);
    throw error;
  }
};

/**
 * Create a new group
 */
export const createGroup = async (teacherId, name, description = '') => {
  try {
    const { data, error } = await supabase
      .from('teacher_groups')
      .insert([{ teacher_id: teacherId, name, description }])
      .select()
      .single();

    if (error) throw error;
    return { ...data, students: [], studentIds: [] };
  } catch (error) {
    console.error('Create group error:', error);
    throw error;
  }
};

/**
 * Update a group
 */
export const updateGroup = async (groupId, updates) => {
  try {
    const { data, error } = await supabase
      .from('teacher_groups')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Update group error:', error);
    throw error;
  }
};

/**
 * Delete a group
 */
export const deleteGroup = async (groupId) => {
  try {
    const { error } = await supabase
      .from('teacher_groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
  } catch (error) {
    console.error('Delete group error:', error);
    throw error;
  }
};

/**
 * Add student to group
 */
export const addStudentToGroup = async (groupId, studentId) => {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .insert([{ group_id: groupId, student_id: studentId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Add student to group error:', error);
    throw error;
  }
};

/**
 * Remove student from group
 */
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
 * Get groups a student belongs to
 */
export const getStudentGroups = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        group:teacher_groups (
          id,
          name,
          description,
          teacher_id
        )
      `)
      .eq('student_id', studentId);

    if (error) throw error;
    return (data || []).map(gm => gm.group);
  } catch (error) {
    console.error('Get student groups error:', error);
    throw error;
  }
};

// =============================================
// BATCH OPERATIONS FOR GROUPS
// =============================================

/**
 * Add observation to group (creates for each student in group)
 */
export const addObservationToGroup = async (groupId, teacherId, text) => {
  try {
    // First, get all students in the group
    const { data: members, error: memberError } = await supabase
      .from('group_members')
      .select('student_id')
      .eq('group_id', groupId);

    if (memberError) throw memberError;

    // Create observations for each student with group_id reference
    const observations = members.map(member => ({
      student_id: member.student_id,
      teacher_id: teacherId,
      text,
      group_id: groupId
    }));

    const { data, error } = await supabase
      .from('observations')
      .insert(observations)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Add observation to group error:', error);
    throw error;
  }
};

/**
 * Add material to group
 */
export const addMaterialToGroup = async (teacherId, title, url, description, groupIds, isGlobal = false) => {
  try {
    const { data, error } = await supabase
      .from('learning_materials')
      .insert([{
        teacher_id: teacherId,
        title,
        url,
        description,
        group_ids: groupIds,
        is_global: isGlobal,
        student_ids: []
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Add material to group error:', error);
    throw error;
  }
};

/**
 * Add improvement area to group
 */
export const addImprovementToGroup = async (groupId, teacherId, area, details, suggestions) => {
  try {
    // Get all students in group
    const { data: members, error: memberError } = await supabase
      .from('group_members')
      .select('student_id')
      .eq('group_id', groupId);

    if (memberError) throw memberError;

    // Create improvements for each student
    const improvements = members.map(member => ({
      student_id: member.student_id,
      teacher_id: teacherId,
      area,
      details,
      suggestions,
      group_id: groupId
    }));

    const { data, error } = await supabase
      .from('areas_to_improve')
      .insert(improvements)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Add improvement to group error:', error);
    throw error;
  }
};

/**
 * Add announcement to groups
 */
export const addAnnouncementToGroups = async (teacherId, title, message, priority, groupIds) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .insert([{
        teacher_id: teacherId,
        title,
        message,
        priority,
        group_ids: groupIds,
        is_global: false
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Add announcement to groups error:', error);
    throw error;
  }
};

// =============================================
// PROGRESS TRACKING
// =============================================

/**
 * Get progress history for a student
 */
export const getProgressHistory = async (studentId, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('progress_history')
      .select('*')
      .eq('student_id', studentId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get progress history error:', error);
    throw error;
  }
};

/**
 * Get progress history for multiple students (for teacher overview)
 */
export const getMultipleStudentsProgress = async (studentIds, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('progress_history')
      .select(`
        *,
        student:profiles (
          id,
          display_name,
          email
        )
      `)
      .in('student_id', studentIds)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get multiple students progress error:', error);
    throw error;
  }
};

/**
 * Record a progress snapshot
 */
export const recordProgressSnapshot = async (studentId, vocabularyCount, fluencyScore, conversationCount, practiceMinutes = 0) => {
  try {
    const { data, error } = await supabase
      .from('progress_history')
      .insert([{
        student_id: studentId,
        vocabulary_count: vocabularyCount,
        fluency_score: fluencyScore,
        conversation_count: conversationCount,
        practice_minutes: practiceMinutes
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Record progress snapshot error:', error);
    throw error;
  }
};

/**
 * Get aggregated stats for a group
 */
export const getGroupStats = async (groupId) => {
  try {
    // Get all students in group
    const { data: members, error: memberError } = await supabase
      .from('group_members')
      .select('student_id')
      .eq('group_id', groupId);

    if (memberError) throw memberError;

    const studentIds = members.map(m => m.student_id);

    // Get latest study guides for all students
    const { data: guides, error: guideError } = await supabase
      .from('study_guides')
      .select('*')
      .in('user_id', studentIds);

    if (guideError) throw guideError;

    // Calculate aggregated stats
    const stats = {
      totalStudents: studentIds.length,
      averageVocabulary: 0,
      averageFluency: 0,
      totalConversations: 0,
      studentsWithProgress: 0
    };

    if (guides && guides.length > 0) {
      const totalVocab = guides.reduce((sum, g) => sum + (g.vocabulary_mastered || 0), 0);
      const totalFluency = guides.reduce((sum, g) => sum + (g.fluency_score || 0), 0);
      const totalConv = guides.reduce((sum, g) => sum + (g.conversation_count || 0), 0);

      stats.averageVocabulary = Math.round(totalVocab / guides.length);
      stats.averageFluency = Math.round(totalFluency / guides.length);
      stats.totalConversations = totalConv;
      stats.studentsWithProgress = guides.filter(g => g.conversation_count > 0).length;
    }

    return stats;
  } catch (error) {
    console.error('Get group stats error:', error);
    throw error;
  }
};

// =============================================
// CONVERSATION & STUDY GUIDE INTEGRATION
// =============================================

/**
 * Save conversation and update study guide progress
 */
export const saveConversationWithProgress = async (userId, messages, title, analysisData = null) => {
  try {
    // Save conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert([{
        user_id: userId,
        messages,
        title
      }])
      .select()
      .single();

    if (convError) throw convError;

    // Get current study guide
    const { data: currentGuide, error: guideError } = await supabase
      .from('study_guides')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (guideError && guideError.code !== 'PGRST116') throw guideError;

    // Calculate new stats from conversation
    const messageCount = messages.filter(m => m.role === 'user').length;
    const newVocab = analysisData?.newVocabulary || Math.floor(messageCount * 2);
    const fluencyBoost = analysisData?.fluencyBoost || Math.min(5, Math.floor(messageCount / 2));

    // Update study guide
    const updatedGuide = {
      conversation_count: (currentGuide?.conversation_count || 0) + 1,
      vocabulary_mastered: (currentGuide?.vocabulary_mastered || 0) + newVocab,
      fluency_score: Math.min(100, (currentGuide?.fluency_score || 0) + fluencyBoost),
      strengths: currentGuide?.strengths || [],
      weaknesses: currentGuide?.weaknesses || [],
      goals: currentGuide?.goals || [],
      recommendations: currentGuide?.recommendations || [],
      updated_at: new Date().toISOString()
    };

    // Add analysis-based updates if provided
    if (analysisData?.strengths) {
      const existingStrengths = new Set(updatedGuide.strengths);
      analysisData.strengths.forEach(s => existingStrengths.add(s));
      updatedGuide.strengths = Array.from(existingStrengths).slice(0, 10);
    }

    if (analysisData?.weaknesses) {
      const existingWeaknesses = new Set(updatedGuide.weaknesses);
      analysisData.weaknesses.forEach(w => existingWeaknesses.add(w));
      updatedGuide.weaknesses = Array.from(existingWeaknesses).slice(0, 10);
    }

    // Upsert study guide
    const { data: guide, error: upsertError } = await supabase
      .from('study_guides')
      .upsert({
        user_id: userId,
        ...updatedGuide
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (upsertError) throw upsertError;

    return { conversation, guide };
  } catch (error) {
    console.error('Save conversation with progress error:', error);
    throw error;
  }
};

/**
 * Get all data needed for student progress charts
 */
export const getStudentChartData = async (studentId, days = 30) => {
  try {
    const [progressHistory, guide, conversations] = await Promise.all([
      getProgressHistory(studentId, days),
      supabase.from('study_guides').select('*').eq('user_id', studentId).single(),
      supabase.from('conversations').select('id, created_at').eq('user_id', studentId)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    ]);

    // Group conversations by day for activity chart
    const activityByDay = {};
    (conversations.data || []).forEach(conv => {
      const day = new Date(conv.created_at).toISOString().split('T')[0];
      activityByDay[day] = (activityByDay[day] || 0) + 1;
    });

    return {
      progressHistory,
      currentStats: guide.data || {},
      activityByDay,
      totalConversations: (conversations.data || []).length
    };
  } catch (error) {
    console.error('Get student chart data error:', error);
    throw error;
  }
};

/**
 * Get teacher overview chart data
 */
export const getTeacherOverviewData = async (teacherId, days = 30) => {
  try {
    // Get all students
    const { data: students, error: studentError } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('teacher_id', teacherId)
      .eq('role', 'student');

    if (studentError) throw studentError;

    const studentIds = students.map(s => s.id);

    // Get all study guides
    const { data: guides, error: guideError } = await supabase
      .from('study_guides')
      .select('*')
      .in('user_id', studentIds);

    if (guideError) throw guideError;

    // Get progress history for all students
    const progressData = await getMultipleStudentsProgress(studentIds, days);

    // Calculate aggregate stats
    const aggregateStats = {
      totalStudents: students.length,
      activeStudents: 0,
      averageVocabulary: 0,
      averageFluency: 0,
      totalConversations: 0
    };

    if (guides && guides.length > 0) {
      aggregateStats.activeStudents = guides.filter(g => g.conversation_count > 0).length;
      aggregateStats.averageVocabulary = Math.round(
        guides.reduce((sum, g) => sum + (g.vocabulary_mastered || 0), 0) / guides.length
      );
      aggregateStats.averageFluency = Math.round(
        guides.reduce((sum, g) => sum + (g.fluency_score || 0), 0) / guides.length
      );
      aggregateStats.totalConversations = guides.reduce((sum, g) => sum + (g.conversation_count || 0), 0);
    }

    // Create student comparison data
    const studentComparison = students.map(student => {
      const guide = guides?.find(g => g.user_id === student.id) || {};
      return {
        id: student.id,
        name: student.display_name || student.email?.split('@')[0],
        vocabulary: guide.vocabulary_mastered || 0,
        fluency: guide.fluency_score || 0,
        conversations: guide.conversation_count || 0
      };
    });

    return {
      students,
      guides,
      progressHistory: progressData,
      aggregateStats,
      studentComparison
    };
  } catch (error) {
    console.error('Get teacher overview data error:', error);
    throw error;
  }
};