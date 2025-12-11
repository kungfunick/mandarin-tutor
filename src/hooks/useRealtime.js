/**
 * useRealtime Hook
 * Subscribe to real-time database changes
 */

import { useEffect, useState } from 'react';
import { subscribeToTable, unsubscribe } from '../services/supabase';

/**
 * Subscribe to real-time changes on a table
 * @param {string} table - Table name
 * @param {string} filter - Optional filter (e.g., "id=eq.123")
 * @param {function} onUpdate - Callback when data changes
 */
export const useRealtime = (table, filter = null, onUpdate) => {
  const [channel, setChannel] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!table) return;

    try {
      // Subscribe to table changes
      const newChannel = subscribeToTable(table, filter, (payload) => {
        // Call the update callback with the payload
        if (onUpdate) {
          onUpdate(payload);
        }
        setIsConnected(true);
      });

      setChannel(newChannel);

      // Cleanup on unmount
      return () => {
        if (newChannel) {
          unsubscribe(newChannel);
        }
      };
    } catch (err) {
      console.error('Realtime subscription error:', err);
      setError(err.message);
    }
  }, [table, filter]);

  return { isConnected, error, channel };
};

/**
 * Subscribe to user profile changes
 */
export const useUserProfileRealtime = (userId, onUpdate) => {
  return useRealtime('profiles', `id=eq.${userId}`, onUpdate);
};

/**
 * Subscribe to student list changes (for teachers)
 */
export const useStudentListRealtime = (teacherId, onUpdate) => {
  return useRealtime('profiles', `teacher_id=eq.${teacherId}`, onUpdate);
};

/**
 * Subscribe to study guide changes
 */
export const useStudyGuideRealtime = (userId, onUpdate) => {
  return useRealtime('study_guides', `user_id=eq.${userId}`, onUpdate);
};

/**
 * Subscribe to observations for a student
 */
export const useObservationsRealtime = (studentId, onUpdate) => {
  return useRealtime('observations', `student_id=eq.${studentId}`, onUpdate);
};

/**
 * Subscribe to materials for a teacher
 */
export const useMaterialsRealtime = (teacherId, onUpdate) => {
  return useRealtime('learning_materials', `teacher_id=eq.${teacherId}`, onUpdate);
};

/**
 * Subscribe to announcements
 */
export const useAnnouncementsRealtime = (teacherId, onUpdate) => {
  return useRealtime('announcements', `teacher_id=eq.${teacherId}`, onUpdate);
};

/**
 * Subscribe to all user changes (admin only)
 */
export const useAllUsersRealtime = (onUpdate) => {
  return useRealtime('profiles', null, onUpdate);
};

export default useRealtime;
