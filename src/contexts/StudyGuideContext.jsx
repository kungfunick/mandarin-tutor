/**
 * StudyGuideContext - Database-backed Study Guide
 * Manages student study guides with real database persistence
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getStudyGuide as fetchStudyGuide,
  upsertStudyGuide,
  updateStudyGuideStats,
  getObservationsByStudent,
  getMaterialsForStudent,
  getImprovementsByStudent,
  getAnnouncementsForStudent,
  addObservation as createObservation
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
  const { userId, teacherId, isStudent, profile } = useAuth();

  const [studyGuide, setStudyGuide] = useState(null);
  const [observations, setObservations] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [improvements, setImprovements] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [allStudyGuides, setAllStudyGuides] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to real-time updates
  useStudyGuideRealtime(userId, (payload) => {
    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
      setStudyGuide(payload.new);
    }
  });

  // Load study guide data
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadStudyGuideData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load study guide
        const guide = await fetchStudyGuide(userId);

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
          try {
            const [obs, mats, imps, anns] = await Promise.all([
              getObservationsByStudent(userId).catch(() => []),
              getMaterialsForStudent(userId, teacherId).catch(() => []),
              getImprovementsByStudent(userId).catch(() => []),
              getAnnouncementsForStudent(teacherId).catch(() => [])
            ]);

            setObservations(obs || []);
            setMaterials(mats || []);
            setImprovements(imps || []);
            setAnnouncements(anns || []);
          } catch (err) {
            console.error('Error loading related data:', err);
          }
        }
      } catch (err) {
        console.error('Load study guide error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStudyGuideData();
  }, [userId, teacherId]);

  // Get study guide for a specific user (for teachers)
  const getStudyGuide = useCallback((targetUserId) => {
    if (targetUserId === userId) {
      return studyGuide;
    }
    return allStudyGuides[targetUserId] || null;
  }, [userId, studyGuide, allStudyGuides]);

  // Get all study guides (for teachers)
  const getAllStudyGuides = useCallback(() => {
    return { [userId]: studyGuide, ...allStudyGuides };
  }, [userId, studyGuide, allStudyGuides]);

  // Generate study guide from conversation history
  const generateStudyGuide = useCallback(async (targetUserId, conversationHistory) => {
    try {
      const guide = {
        conversation_count: conversationHistory.length,
        vocabulary_mastered: Math.floor(conversationHistory.length * 5),
        fluency_score: Math.min(100, conversationHistory.length * 2),
        strengths: ['Basic greetings', 'Simple sentences'],
        weaknesses: [],
        goals: [
          { id: '1', title: 'Practice tones', description: 'Focus on the four tones', completed: false },
          { id: '2', title: 'Learn 10 new words', description: 'Expand vocabulary', completed: false }
        ],
        recommendations: [
          { title: 'Daily practice', description: 'Practice 15 minutes daily', category: 'general', priority: 'high' }
        ]
      };

      const newGuide = await upsertStudyGuide(targetUserId, guide);
      
      if (targetUserId === userId) {
        setStudyGuide(newGuide);
      } else {
        setAllStudyGuides(prev => ({ ...prev, [targetUserId]: newGuide }));
      }
      
      return newGuide;
    } catch (err) {
      console.error('Generate study guide error:', err);
      throw err;
    }
  }, [userId]);

  // Add observation
  const addObservation = useCallback(async (targetUserId, text) => {
    try {
      if (!profile?.id) throw new Error('Not authenticated');
      
      const observation = await createObservation(targetUserId, profile.id, text);
      setObservations(prev => [observation, ...prev]);
      return observation;
    } catch (err) {
      console.error('Add observation error:', err);
      throw err;
    }
  }, [profile]);

  // Complete goal
  const completeGoal = useCallback(async (targetUserId, goalId) => {
    try {
      const guide = targetUserId === userId ? studyGuide : allStudyGuides[targetUserId];
      if (!guide?.goals) return;

      const goals = guide.goals.map(g => 
        g.id === goalId 
          ? { ...g, completed: true, completedAt: new Date().toISOString() }
          : g
      );

      const updated = await updateStudyGuideStats(targetUserId, { goals });
      
      if (targetUserId === userId) {
        setStudyGuide(updated);
      } else {
        setAllStudyGuides(prev => ({ ...prev, [targetUserId]: updated }));
      }
    } catch (err) {
      console.error('Complete goal error:', err);
    }
  }, [userId, studyGuide, allStudyGuides]);

  // Update study guide stats
  const updateStats = useCallback(async (stats) => {
    try {
      if (!userId) return { success: false, error: 'Not authenticated' };

      const updated = await updateStudyGuideStats(userId, stats);
      setStudyGuide(updated);
      return { success: true };
    } catch (err) {
      console.error('Update stats error:', err);
      return { success: false, error: err.message };
    }
  }, [userId]);

  // Refresh all data
  const refresh = useCallback(async () => {
    try {
      setLoading(true);

      const [guide, obs, mats, imps, anns] = await Promise.all([
        fetchStudyGuide(userId),
        getObservationsByStudent(userId).catch(() => []),
        teacherId ? getMaterialsForStudent(userId, teacherId).catch(() => []) : [],
        getImprovementsByStudent(userId).catch(() => []),
        teacherId ? getAnnouncementsForStudent(teacherId).catch(() => []) : []
      ]);

      setStudyGuide(guide);
      setObservations(obs || []);
      setMaterials(mats || []);
      setImprovements(imps || []);
      setAnnouncements(anns || []);
    } catch (err) {
      console.error('Refresh error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, teacherId]);

  // Format guide for display (compatibility with old format)
  const formattedGuide = studyGuide ? {
    ...studyGuide,
    conversationCount: studyGuide.conversation_count || 0,
    progress: {
      vocabularyMastered: studyGuide.vocabulary_mastered || 0,
      grammarPointsCovered: Math.floor((studyGuide.conversation_count || 0) / 2),
      fluencyScore: studyGuide.fluency_score || 0
    },
    analysis: {
      strengths: studyGuide.strengths || [],
      commonMistakes: []
    },
    weeklyGoals: studyGuide.goals || [],
    recommendations: studyGuide.recommendations || [],
    observations: observations,
    lastUpdated: studyGuide.updated_at || new Date().toISOString()
  } : null;

  const value = {
    // State
    studyGuide: formattedGuide,
    observations,
    materials,
    improvements,
    announcements,
    loading,
    error,

    // Functions
    getStudyGuide,
    getAllStudyGuides,
    generateStudyGuide,
    addObservation,
    completeGoal,
    updateStats,
    refresh,

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