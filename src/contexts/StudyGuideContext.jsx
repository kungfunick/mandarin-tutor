/**
 * StudyGuideContext - Database-backed Study Guide
 * Manages student study guides with real database persistence
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  getStudyGuide,
  upsertStudyGuide,
  updateStudyGuideStats,
  getObservationsByStudent,
  getMaterialsForStudent,
  getImprovementsByStudent,
  getAnnouncementsForStudent
} from '../services/database';
import { useStudyGuideRealtime } from '../hooks/useRealtime';

const StudyGuideContext = createContext();

export const useStudyGuide = () => {
  const context = useContext(StudyGuideContext);
  if (!context) {
    throw new Error('useStudyGuide must be used within a StudyGuideProvider');
  }
  return context;
};

export const StudyGuideProvider = ({ children }) => {
  const { userId, teacherId, isStudent } = useAuth();

  const [studyGuide, setStudyGuide] = useState(null);
  const [observations, setObservations] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [improvements, setImprovements] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to real-time updates
  useStudyGuideRealtime(userId, (payload) => {
    if (payload.eventType === 'UPDATE') {
      setStudyGuide(payload.new);
    } else if (payload.eventType === 'INSERT') {
      setStudyGuide(payload.new);
    }
  });

  // Load study guide data
  useEffect(() => {
    if (!userId || !isStudent) return;

    const loadStudyGuideData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load study guide
        const guide = await getStudyGuide(userId);

        // If no guide exists, create a default one
        if (!guide) {
          const defaultGuide = {
            conversation_count: 0,
            vocabulary_mastered: 0,
            fluency_score: 0,
            strengths: [],
            weaknesses: [],
            goals: [],
            recommendations: []
          };
          const newGuide = await upsertStudyGuide(userId, defaultGuide);
          setStudyGuide(newGuide);
        } else {
          setStudyGuide(guide);
        }

        // Load related data if student has a teacher
        if (teacherId) {
          const [obs, mats, imps, anns] = await Promise.all([
            getObservationsByStudent(userId),
            getMaterialsForStudent(userId, teacherId),
            getImprovementsByStudent(userId),
            getAnnouncementsForStudent(teacherId)
          ]);

          setObservations(obs);
          setMaterials(mats);
          setImprovements(imps);
          setAnnouncements(anns);
        }
      } catch (err) {
        console.error('Load study guide error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStudyGuideData();
  }, [userId, teacherId, isStudent]);

  // Update study guide stats after conversation
  const updateStats = async (stats) => {
    try {
      if (!userId) return { success: false, error: 'Not authenticated' };

      const updated = await updateStudyGuideStats(userId, stats);
      setStudyGuide(updated);
      return { success: true };
    } catch (err) {
      console.error('Update stats error:', err);
      return { success: false, error: err.message };
    }
  };

  // Increment conversation count
  const incrementConversationCount = async () => {
    try {
      if (!studyGuide) return;

      const newCount = (studyGuide.conversation_count || 0) + 1;
      await updateStats({ conversation_count: newCount });
    } catch (err) {
      console.error('Increment conversation error:', err);
    }
  };

  // Update vocabulary count
  const updateVocabulary = async (count) => {
    try {
      await updateStats({ vocabulary_mastered: count });
    } catch (err) {
      console.error('Update vocabulary error:', err);
    }
  };

  // Update fluency score
  const updateFluency = async (score) => {
    try {
      await updateStats({ fluency_score: score });
    } catch (err) {
      console.error('Update fluency error:', err);
    }
  };

  // Add strength
  const addStrength = async (strength) => {
    try {
      if (!studyGuide) return;

      const strengths = [...(studyGuide.strengths || []), strength];
      await updateStats({ strengths });
    } catch (err) {
      console.error('Add strength error:', err);
    }
  };

  // Add weakness
  const addWeakness = async (weakness) => {
    try {
      if (!studyGuide) return;

      const weaknesses = [...(studyGuide.weaknesses || []), weakness];
      await updateStats({ weaknesses });
    } catch (err) {
      console.error('Add weakness error:', err);
    }
  };

  // Update goals
  const updateGoals = async (goals) => {
    try {
      await updateStats({ goals });
    } catch (err) {
      console.error('Update goals error:', err);
    }
  };

  // Complete goal
  const completeGoal = async (goalIndex) => {
    try {
      if (!studyGuide?.goals) return;

      const goals = [...studyGuide.goals];
      if (goals[goalIndex]) {
        goals[goalIndex].completed = true;
        goals[goalIndex].completedAt = new Date().toISOString();
        await updateGoals(goals);
      }
    } catch (err) {
      console.error('Complete goal error:', err);
    }
  };

  // Update recommendations
  const updateRecommendations = async (recommendations) => {
    try {
      await updateStats({ recommendations });
    } catch (err) {
      console.error('Update recommendations error:', err);
    }
  };

  // Refresh all data
  const refresh = async () => {
    try {
      setLoading(true);

      const [guide, obs, mats, imps, anns] = await Promise.all([
        getStudyGuide(userId),
        getObservationsByStudent(userId),
        teacherId ? getMaterialsForStudent(userId, teacherId) : [],
        getImprovementsByStudent(userId),
        teacherId ? getAnnouncementsForStudent(teacherId) : []
      ]);

      setStudyGuide(guide);
      setObservations(obs);
      setMaterials(mats);
      setImprovements(imps);
      setAnnouncements(anns);
    } catch (err) {
      console.error('Refresh error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get summary stats
  const getSummary = () => {
    if (!studyGuide) return null;

    return {
      conversations: studyGuide.conversation_count || 0,
      vocabulary: studyGuide.vocabulary_mastered || 0,
      fluency: studyGuide.fluency_score || 0,
      strengths: studyGuide.strengths?.length || 0,
      weaknesses: studyGuide.weaknesses?.length || 0,
      goals: studyGuide.goals?.length || 0,
      goalsCompleted: studyGuide.goals?.filter(g => g.completed)?.length || 0,
      recommendations: studyGuide.recommendations?.length || 0,
      observations: observations.length,
      materials: materials.length,
      improvements: improvements.length,
      announcements: announcements.length
    };
  };

  const value = {
    // State
    studyGuide,
    observations,
    materials,
    improvements,
    announcements,
    loading,
    error,

    // Update functions
    updateStats,
    incrementConversationCount,
    updateVocabulary,
    updateFluency,
    addStrength,
    addWeakness,
    updateGoals,
    completeGoal,
    updateRecommendations,

    // Utility functions
    refresh,
    getSummary,

    // Computed values
    hasTeacher: !!teacherId,
    conversationCount: studyGuide?.conversation_count || 0,
    vocabularyMastered: studyGuide?.vocabulary_mastered || 0,
    fluencyScore: studyGuide?.fluency_score || 0,
    strengths: studyGuide?.strengths || [],
    weaknesses: studyGuide?.weaknesses || [],
    goals: studyGuide?.goals || [],
    recommendations: studyGuide?.recommendations || []
  };

  return (
    <StudyGuideContext.Provider value={value}>
      {children}
    </StudyGuideContext.Provider>
  );
};

export default StudyGuideContext;
