/**
 * Teacher Dashboard Component - V11
 * Mobile-First Design with Database-Backed Groups
 * Features: Student management, Groups with DB persistence, Progress Charts, Batch operations
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudyGuide } from '../contexts/StudyGuideContext';
import {
  Users, User, BookOpen, Bell, FileText, BarChart3, TrendingUp, MessageSquare,
  ChevronRight, Plus, Trash2, Send, X, Link as LinkIcon,
  AlertTriangle, Globe, ChevronLeft, UserPlus, UserMinus,
  FolderPlus, Edit2, Check, Users2, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { TeacherOverviewCharts, GroupStatsChart } from './ProgressCharts';

// Import extended database functions - these need to be added to database.js
// For now, inline the functions if not imported

export const TeacherDashboard = ({ onClose }) => {
  const { user, profile, getStudents, refreshUser } = useAuth();
  const { getAllStudyGuides, addObservation } = useStudyGuide();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('students');
  
  // Data states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [studyGuides, setStudyGuides] = useState({});
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Charts data
  const [chartsData, setChartsData] = useState(null);
  const [chartsLoading, setChartsLoading] = useState(false);

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedStudentsForGroup, setSelectedStudentsForGroup] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});

  // Forms
  const [showObservationForm, setShowObservationForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showImprovementForm, setShowImprovementForm] = useState(false);
  const [selectedStudentForImprovement, setSelectedStudentForImprovement] = useState(null);

  // Form data
  const [newObservation, setNewObservation] = useState('');
  const [observationTarget, setObservationTarget] = useState({ type: 'student', id: null });
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'normal',
    targetType: 'all',
    targetIds: []
  });
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    url: '',
    description: '',
    targetType: 'all',
    targetIds: []
  });
  const [newImprovement, setNewImprovement] = useState({
    area: '',
    details: '',
    suggestions: ''
  });

  // Tab configuration
  const tabs = [
    { id: 'students', icon: Users, label: 'Students', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-600' },
    { id: 'groups', icon: Users2, label: 'Groups', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-600' },
    { id: 'charts', icon: BarChart3, label: 'Overview', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-600' },
    { id: 'observations', icon: FileText, label: 'Notes', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-600' },
    { id: 'materials', icon: LinkIcon, label: 'Materials', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-600' },
    { id: 'announcements', icon: Bell, label: 'Announce', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-600' }
  ];

  // Database helper functions (inline until database-extended.js is imported)
  const getTeacherGroups = async (teacherId) => {
    const { data, error } = await supabase
      .from('teacher_groups')
      .select(`
        *,
        group_members (
          student_id,
          student:profiles (id, email, display_name)
        )
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(group => ({
      ...group,
      students: group.group_members?.map(gm => gm.student) || [],
      studentIds: group.group_members?.map(gm => gm.student_id) || []
    }));
  };

  const createGroupInDB = async (teacherId, name) => {
    const { data, error } = await supabase
      .from('teacher_groups')
      .insert([{ teacher_id: teacherId, name }])
      .select()
      .single();
    if (error) throw error;
    return { ...data, students: [], studentIds: [] };
  };

  const deleteGroupInDB = async (groupId) => {
    const { error } = await supabase.from('teacher_groups').delete().eq('id', groupId);
    if (error) throw error;
  };

  const addStudentToGroupInDB = async (groupId, studentId) => {
    const { data, error } = await supabase
      .from('group_members')
      .insert([{ group_id: groupId, student_id: studentId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const removeStudentFromGroupInDB = async (groupId, studentId) => {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('student_id', studentId);
    if (error) throw error;
  };

  // Add observation to student via database
  const addObservationToDB = async (studentId, teacherId, text, groupId = null) => {
    const { data, error } = await supabase
      .from('observations')
      .insert([{
        student_id: studentId,
        teacher_id: teacherId,
        text,
        group_id: groupId
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  // Add observation to all students in a group
  const addObservationToGroupInDB = async (groupId, teacherId, text) => {
    const { data: members } = await supabase
      .from('group_members')
      .select('student_id')
      .eq('group_id', groupId);

    const observations = (members || []).map(member => ({
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
  };

  // Add material with group support
  const addMaterialToDB = async (teacherId, title, url, description, groupIds = [], studentIds = [], isGlobal = false) => {
    const { data, error } = await supabase
      .from('learning_materials')
      .insert([{
        teacher_id: teacherId,
        title,
        url,
        description,
        group_ids: groupIds,
        student_ids: studentIds,
        is_global: isGlobal
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  // Add announcement with group support
  const addAnnouncementToDB = async (teacherId, title, message, priority, groupIds = [], isGlobal = false) => {
    const { data, error } = await supabase
      .from('announcements')
      .insert([{
        teacher_id: teacherId,
        title,
        message,
        priority,
        group_ids: groupIds,
        is_global: isGlobal
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  // Get overview data for charts
  const getTeacherOverviewData = async (teacherId, days = 30) => {
    const { data: studentsList, error: studentError } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('teacher_id', teacherId)
      .eq('role', 'student');

    if (studentError) throw studentError;
    const studentIds = (studentsList || []).map(s => s.id);

    const { data: guides } = await supabase
      .from('study_guides')
      .select('*')
      .in('user_id', studentIds);

    // Calculate aggregate stats
    const aggregateStats = {
      totalStudents: studentsList?.length || 0,
      activeStudents: 0,
      averageVocabulary: 0,
      averageFluency: 0,
      totalConversations: 0
    };

    if (guides?.length > 0) {
      aggregateStats.activeStudents = guides.filter(g => g.conversation_count > 0).length;
      aggregateStats.averageVocabulary = Math.round(
        guides.reduce((sum, g) => sum + (g.vocabulary_mastered || 0), 0) / guides.length
      );
      aggregateStats.averageFluency = Math.round(
        guides.reduce((sum, g) => sum + (g.fluency_score || 0), 0) / guides.length
      );
      aggregateStats.totalConversations = guides.reduce((sum, g) => sum + (g.conversation_count || 0), 0);
    }

    const studentComparison = (studentsList || []).map(student => {
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
      students: studentsList || [],
      guides: guides || [],
      aggregateStats,
      studentComparison,
      progressHistory: []
    };
  };

  // Load all data
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // Load assigned students
      const { data: assignedStudents, error: studentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('role', 'student')
        .order('display_name');

      if (studentError) throw studentError;
      setStudents(assignedStudents || []);

      // Load unassigned students
      await loadUnassignedStudents();

      // Load groups from database
      try {
        const groupsData = await getTeacherGroups(user.id);
        setGroups(groupsData || []);
      } catch (err) {
        // Groups table might not exist yet, fall back to empty
        console.log('Groups not available:', err.message);
        setGroups([]);
      }

      // Load study guides
      const guides = getAllStudyGuides();
      setStudyGuides(guides || {});

    } catch (err) {
      console.error('Error loading data:', err);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  }, [user?.id, getAllStudyGuides]);

  // Load chart data
  const loadChartsData = useCallback(async () => {
    if (!user?.id) return;
    setChartsLoading(true);

    try {
      const data = await getTeacherOverviewData(user.id, 30);
      setChartsData(data);
    } catch (err) {
      console.error('Error loading charts data:', err);
    } finally {
      setChartsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'charts') {
      loadChartsData();
    }
  }, [activeTab, loadChartsData]);

  // Clear message after timeout
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Load unassigned students
  const loadUnassignedStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .is('teacher_id', null)
        .eq('role', 'student')
        .order('display_name');

      if (error) throw error;
      setUnassignedStudents(data || []);
      return data || [];
    } catch (err) {
      console.error('Error loading unassigned students:', err);
      return [];
    }
  };

  // Assign student to teacher
  const handleAssignStudent = async (studentId) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ teacher_id: user.id })
        .eq('id', studentId);

      if (error) throw error;

      const assignedStudent = unassignedStudents.find(s => s.id === studentId);
      if (assignedStudent) {
        setStudents(prev => [...prev, { ...assignedStudent, teacher_id: user.id }]);
        setUnassignedStudents(prev => prev.filter(s => s.id !== studentId));
      }

      setMessage({ type: 'success', text: 'Student assigned successfully' });
    } catch (err) {
      console.error('Error assigning student:', err);
      setMessage({ type: 'error', text: 'Failed to assign student' });
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  // Unassign student
  const handleUnassignStudent = async (studentId) => {
    if (!confirm('Are you sure you want to unassign this student?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ teacher_id: null })
        .eq('id', studentId);

      if (error) throw error;

      const unassignedStudent = students.find(s => s.id === studentId);
      if (unassignedStudent) {
        setUnassignedStudents(prev => [...prev, { ...unassignedStudent, teacher_id: null }]);
        setStudents(prev => prev.filter(s => s.id !== studentId));
      }

      // Remove from all groups
      for (const group of groups) {
        if (group.studentIds?.includes(studentId)) {
          try {
            await removeStudentFromGroupInDB(group.id, studentId);
          } catch (e) {
            console.log('Could not remove from group:', e);
          }
        }
      }

      setMessage({ type: 'success', text: 'Student unassigned' });
      setSelectedStudent(null);
      await loadData();
    } catch (err) {
      console.error('Error unassigning student:', err);
      setMessage({ type: 'error', text: 'Failed to unassign student' });
    } finally {
      setLoading(false);
    }
  };

  // GROUP OPERATIONS

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a group name' });
      return;
    }

    setLoading(true);
    try {
      const newGroup = await createGroupInDB(user.id, newGroupName.trim());
      
      // Add selected students to group
      for (const studentId of selectedStudentsForGroup) {
        await addStudentToGroupInDB(newGroup.id, studentId);
      }

      // Reload groups
      const updatedGroups = await getTeacherGroups(user.id);
      setGroups(updatedGroups);

      setNewGroupName('');
      setSelectedStudentsForGroup([]);
      setShowGroupModal(false);
      setMessage({ type: 'success', text: 'Group created successfully' });
    } catch (err) {
      console.error('Error creating group:', err);
      setMessage({ type: 'error', text: 'Failed to create group. Make sure the groups table exists.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    setLoading(true);
    try {
      await deleteGroupInDB(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setMessage({ type: 'success', text: 'Group deleted' });
    } catch (err) {
      console.error('Error deleting group:', err);
      setMessage({ type: 'error', text: 'Failed to delete group' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToGroup = async (studentId, groupId) => {
    try {
      await addStudentToGroupInDB(groupId, studentId);
      const updatedGroups = await getTeacherGroups(user.id);
      setGroups(updatedGroups);
      setMessage({ type: 'success', text: 'Student added to group' });
    } catch (err) {
      console.error('Error adding student to group:', err);
      setMessage({ type: 'error', text: 'Failed to add student to group' });
    }
  };

  const handleRemoveFromGroup = async (studentId, groupId) => {
    try {
      await removeStudentFromGroupInDB(groupId, studentId);
      const updatedGroups = await getTeacherGroups(user.id);
      setGroups(updatedGroups);
      setMessage({ type: 'success', text: 'Student removed from group' });
    } catch (err) {
      console.error('Error removing student from group:', err);
      setMessage({ type: 'error', text: 'Failed to remove student' });
    }
  };

  // OBSERVATION OPERATIONS

  const handleAddObservation = async () => {
    if (!newObservation.trim()) {
      setMessage({ type: 'error', text: 'Please enter an observation' });
      return;
    }

    setLoading(true);
    try {
      if (observationTarget.type === 'student' && selectedStudent) {
        await addObservationToDB(selectedStudent.id, user.id, newObservation);
      } else if (observationTarget.type === 'group' && observationTarget.id) {
        await addObservationToGroupInDB(observationTarget.id, user.id, newObservation);
      } else if (observationTarget.type === 'all') {
        for (const student of students) {
          await addObservationToDB(student.id, user.id, newObservation);
        }
      }

      setNewObservation('');
      setShowObservationForm(false);
      setObservationTarget({ type: 'student', id: null });
      setMessage({ type: 'success', text: 'Observation added to students' });
      await loadData();
    } catch (err) {
      console.error('Error adding observation:', err);
      setMessage({ type: 'error', text: 'Failed to add observation' });
    } finally {
      setLoading(false);
    }
  };

  // MATERIAL OPERATIONS

  const handleAddMaterial = async () => {
    if (!newMaterial.title.trim() || !newMaterial.url.trim()) {
      setMessage({ type: 'error', text: 'Please fill in title and URL' });
      return;
    }

    setLoading(true);
    try {
      if (newMaterial.targetType === 'all') {
        await addMaterialToDB(user.id, newMaterial.title, newMaterial.url, newMaterial.description, [], [], true);
      } else if (newMaterial.targetType === 'group') {
        await addMaterialToDB(user.id, newMaterial.title, newMaterial.url, newMaterial.description, newMaterial.targetIds, [], false);
      } else {
        await addMaterialToDB(user.id, newMaterial.title, newMaterial.url, newMaterial.description, [], newMaterial.targetIds, false);
      }

      setNewMaterial({ title: '', url: '', description: '', targetType: 'all', targetIds: [] });
      setShowMaterialForm(false);
      setMessage({ type: 'success', text: 'Material added' });
    } catch (err) {
      console.error('Error adding material:', err);
      setMessage({ type: 'error', text: 'Failed to add material' });
    } finally {
      setLoading(false);
    }
  };

  // ANNOUNCEMENT OPERATIONS

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      setMessage({ type: 'error', text: 'Please fill in title and message' });
      return;
    }

    setLoading(true);
    try {
      if (newAnnouncement.targetType === 'all') {
        await addAnnouncementToDB(user.id, newAnnouncement.title, newAnnouncement.message, newAnnouncement.priority, [], true);
      } else if (newAnnouncement.targetType === 'group') {
        await addAnnouncementToDB(user.id, newAnnouncement.title, newAnnouncement.message, newAnnouncement.priority, newAnnouncement.targetIds, false);
      }

      setNewAnnouncement({ title: '', message: '', priority: 'normal', targetType: 'all', targetIds: [] });
      setShowAnnouncementForm(false);
      setMessage({ type: 'success', text: 'Announcement posted' });
    } catch (err) {
      console.error('Error adding announcement:', err);
      setMessage({ type: 'error', text: 'Failed to post announcement' });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getStudentProgress = (studentId) => {
    const guide = studyGuides[studentId];
    if (!guide) return null;
    return {
      vocabulary: guide.progress?.vocabularyMastered || guide.vocabulary_mastered || 0,
      conversations: guide.conversationCount || guide.conversation_count || 0,
      fluencyScore: guide.progress?.fluencyScore || guide.fluency_score || 0
    };
  };

  const getStudentGroups = (studentId) => {
    return groups.filter(group => group.studentIds?.includes(studentId));
  };

  const toggleGroupExpansion = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // MAIN RENDER
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users size={24} className="text-blue-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">Teacher Dashboard</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={loadData}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={18} className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 overflow-x-auto pb-1 -mx-1 px-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? `${tab.bg} ${tab.color} border-b-2 ${tab.border}`
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={18} />
                <span className="text-xs mt-1 font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`px-4 py-2 text-sm ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">
                  My Students ({students.length})
                </h3>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  <UserPlus size={16} className="mr-1" />
                  Assign
                </button>
              </div>

              <div className="space-y-2">
                {students.map((student) => {
                  const progress = getStudentProgress(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className="bg-white border rounded-xl p-3 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={20} className="text-blue-600" />
                          </div>
                          <div className="ml-3 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {student.display_name || student.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{student.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {progress && (
                            <div className="text-right hidden sm:block">
                              <p className="text-sm font-medium text-red-600">{progress.vocabulary} words</p>
                              <p className="text-xs text-gray-500">{progress.fluencyScore}% fluency</p>
                            </div>
                          )}
                          <ChevronRight size={18} className="text-gray-400" />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {students.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Users size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No students assigned yet</p>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="mt-3 text-blue-600 text-sm hover:underline"
                    >
                      Assign your first student
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Groups Tab */}
          {activeTab === 'groups' && (
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Groups ({groups.length})</h3>
                <button
                  onClick={() => {
                    setEditingGroup(null);
                    setNewGroupName('');
                    setSelectedStudentsForGroup([]);
                    setShowGroupModal(true);
                  }}
                  className="flex items-center px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700"
                >
                  <FolderPlus size={16} className="mr-1" />
                  New Group
                </button>
              </div>

              <div className="space-y-3">
                {groups.map((group) => {
                  const isExpanded = expandedGroups[group.id];
                  const groupStudents = group.students || [];

                  return (
                    <div key={group.id} className="bg-white border rounded-xl overflow-hidden">
                      <div
                        onClick={() => toggleGroupExpansion(group.id)}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                            <Users2 size={20} className="text-cyan-600" />
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">{group.name}</p>
                            <p className="text-xs text-gray-500">{groupStudents.length} students</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingGroup(group);
                              setNewGroupName(group.name);
                              setSelectedStudentsForGroup(group.studentIds || []);
                              setShowGroupModal(true);
                            }}
                            className="p-1.5 hover:bg-cyan-100 rounded-lg"
                          >
                            <Edit2 size={14} className="text-cyan-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group.id);
                            }}
                            className="p-1.5 hover:bg-red-100 rounded-lg"
                          >
                            <Trash2 size={14} className="text-red-600" />
                          </button>
                          {isExpanded ? (
                            <ChevronUp size={20} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={20} className="text-gray-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t bg-gray-50 p-3">
                          {/* Add observation to group */}
                          <div className="mb-3">
                            <button
                              onClick={() => {
                                setObservationTarget({ type: 'group', id: group.id });
                                setShowObservationForm(true);
                              }}
                              className="w-full py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100"
                            >
                              <FileText size={14} className="inline mr-1" />
                              Add Note to Group
                            </button>
                          </div>

                          {groupStudents.length > 0 ? (
                            <div className="space-y-2">
                              {groupStudents.map(student => (
                                <div
                                  key={student.id}
                                  onClick={() => setSelectedStudent(students.find(s => s.id === student.id) || student)}
                                  className="flex items-center justify-between bg-white rounded-lg p-2 cursor-pointer hover:shadow-sm"
                                >
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                      <User size={14} className="text-blue-600" />
                                    </div>
                                    <span className="ml-2 text-sm font-medium">
                                      {student.display_name || student.email?.split('@')[0]}
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveFromGroup(student.id, group.id);
                                    }}
                                    className="p-1 hover:bg-red-100 rounded"
                                  >
                                    <X size={14} className="text-red-500" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No students in this group</p>
                          )}

                          {/* Add student to group */}
                          {students.filter(s => !group.studentIds?.includes(s.id)).length > 0 && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAddToGroup(e.target.value, group.id);
                                  e.target.value = '';
                                }
                              }}
                              className="mt-2 w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 bg-white"
                              defaultValue=""
                            >
                              <option value="" disabled>+ Add student to group</option>
                              {students.filter(s => !group.studentIds?.includes(s.id)).map(student => (
                                <option key={student.id} value={student.id}>
                                  {student.display_name || student.email?.split('@')[0]}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {groups.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Users2 size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No groups created yet</p>
                    <p className="text-xs text-gray-400 mt-1">Create groups to organize your students</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Charts Tab */}
          {activeTab === 'charts' && (
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Class Overview</h3>
              {chartsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw size={32} className="text-gray-400 animate-spin" />
                </div>
              ) : chartsData ? (
                <TeacherOverviewCharts
                  students={chartsData.students}
                  studentComparison={chartsData.studentComparison}
                  aggregateStats={chartsData.aggregateStats}
                  progressHistory={chartsData.progressHistory}
                  onRefresh={loadChartsData}
                  onSelectStudent={(s) => setSelectedStudent(students.find(st => st.id === s.id))}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No data available yet</p>
                </div>
              )}
            </div>
          )}

          {/* Notes/Observations Tab */}
          {activeTab === 'observations' && (
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Observations</h3>
                <button
                  onClick={() => {
                    setObservationTarget({ type: 'all', id: null });
                    setShowObservationForm(true);
                  }}
                  className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                >
                  <Plus size={16} className="mr-1" />
                  Add to All
                </button>
              </div>

              {/* Observation Form */}
              {showObservationForm && (
                <div className="mb-4 p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm font-medium text-purple-800 mb-2">
                    Adding note to: {
                      observationTarget.type === 'all' ? 'All Students' :
                      observationTarget.type === 'group' ? groups.find(g => g.id === observationTarget.id)?.name :
                      selectedStudent?.display_name
                    }
                  </p>
                  <textarea
                    value={newObservation}
                    onChange={(e) => setNewObservation(e.target.value)}
                    placeholder="Write your observation..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => {
                        setShowObservationForm(false);
                        setNewObservation('');
                      }}
                      className="px-3 py-1.5 text-sm text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddObservation}
                      disabled={loading}
                      className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}

              {/* List students with notes */}
              <div className="space-y-3">
                {students.map((student) => {
                  const guide = studyGuides[student.id];
                  const observations = guide?.observations || [];
                  return (
                    <div key={student.id} className="bg-white border rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <User size={16} className="text-purple-600" />
                          </div>
                          <span className="ml-2 font-medium text-gray-900 text-sm">
                            {student.display_name || student.email?.split('@')[0]}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setObservationTarget({ type: 'student', id: student.id });
                            setShowObservationForm(true);
                          }}
                          className="text-xs text-purple-600 hover:underline"
                        >
                          + Add Note
                        </button>
                      </div>
                      {observations.length > 0 ? (
                        <div className="space-y-1">
                          {observations.slice(-2).map((obs, idx) => (
                            <p key={idx} className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                              {obs.text}
                              <span className="text-xs text-gray-400 ml-2">
                                {new Date(obs.created_at || obs.timestamp).toLocaleDateString()}
                              </span>
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No observations yet</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Materials Tab */}
          {activeTab === 'materials' && (
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Learning Materials</h3>
                <button
                  onClick={() => setShowMaterialForm(true)}
                  className="flex items-center px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
                >
                  <Plus size={16} className="mr-1" />
                  Add Material
                </button>
              </div>

              {/* Material Form */}
              {showMaterialForm && (
                <div className="mb-4 p-4 bg-teal-50 rounded-xl">
                  <input
                    type="text"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Material title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                  />
                  <input
                    type="url"
                    value={newMaterial.url}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="URL (https://...)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                  />
                  <textarea
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm mb-2"
                    rows={2}
                  />
                  
                  {/* Target selection */}
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-600 mb-1">Share with:</p>
                    <div className="flex space-x-2">
                      {['all', 'group', 'students'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setNewMaterial(prev => ({ ...prev, targetType: type, targetIds: [] }))}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            newMaterial.targetType === type
                              ? 'bg-teal-600 text-white'
                              : 'bg-white border text-gray-600'
                          }`}
                        >
                          {type === 'all' ? 'All Students' : type === 'group' ? 'Groups' : 'Select Students'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {newMaterial.targetType === 'group' && (
                    <select
                      multiple
                      value={newMaterial.targetIds}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                        setNewMaterial(prev => ({ ...prev, targetIds: selected }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                    >
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  )}

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setShowMaterialForm(false);
                        setNewMaterial({ title: '', url: '', description: '', targetType: 'all', targetIds: [] });
                      }}
                      className="px-3 py-1.5 text-sm text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddMaterial}
                      disabled={loading}
                      className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Add Material'}
                    </button>
                  </div>
                </div>
              )}

              <div className="text-center py-8 text-gray-500">
                <LinkIcon size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Materials will appear here</p>
              </div>
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Announcements</h3>
                <button
                  onClick={() => setShowAnnouncementForm(true)}
                  className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                >
                  <Plus size={16} className="mr-1" />
                  New Announcement
                </button>
              </div>

              {/* Announcement Form */}
              {showAnnouncementForm && (
                <div className="mb-4 p-4 bg-red-50 rounded-xl">
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Announcement title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                  />
                  <textarea
                    value={newAnnouncement.message}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Announcement message"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm mb-2"
                    rows={3}
                  />
                  
                  {/* Priority */}
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-600 mb-1">Priority:</p>
                    <div className="flex space-x-2">
                      {['normal', 'important', 'urgent'].map((priority) => (
                        <button
                          key={priority}
                          onClick={() => setNewAnnouncement(prev => ({ ...prev, priority }))}
                          className={`px-3 py-1 rounded-lg text-sm capitalize ${
                            newAnnouncement.priority === priority
                              ? priority === 'urgent' ? 'bg-red-600 text-white' :
                                priority === 'important' ? 'bg-orange-600 text-white' :
                                'bg-gray-600 text-white'
                              : 'bg-white border text-gray-600'
                          }`}
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target selection */}
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-600 mb-1">Send to:</p>
                    <div className="flex space-x-2">
                      {['all', 'group'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setNewAnnouncement(prev => ({ ...prev, targetType: type, targetIds: [] }))}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            newAnnouncement.targetType === type
                              ? 'bg-red-600 text-white'
                              : 'bg-white border text-gray-600'
                          }`}
                        >
                          {type === 'all' ? 'All Students' : 'Select Groups'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {newAnnouncement.targetType === 'group' && (
                    <select
                      multiple
                      value={newAnnouncement.targetIds}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                        setNewAnnouncement(prev => ({ ...prev, targetIds: selected }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                    >
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  )}

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setShowAnnouncementForm(false);
                        setNewAnnouncement({ title: '', message: '', priority: 'normal', targetType: 'all', targetIds: [] });
                      }}
                      className="px-3 py-1.5 text-sm text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddAnnouncement}
                      disabled={loading}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {loading ? 'Posting...' : 'Post Announcement'}
                    </button>
                  </div>
                </div>
              )}

              <div className="text-center py-8 text-gray-500">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Announcements will appear here</p>
              </div>
            </div>
          )}
        </div>

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex-shrink-0 bg-white p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={24} className="text-blue-600" />
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <h2 className="text-lg font-bold text-gray-900 truncate">
                        {selectedStudent.display_name || selectedStudent.email?.split('@')[0]}
                      </h2>
                      <p className="text-sm text-gray-600 truncate">{selectedStudent.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X size={20} className="text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Progress Stats */}
                {(() => {
                  const progress = getStudentProgress(selectedStudent.id);
                  if (!progress) return null;
                  return (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-red-50 rounded-xl p-3 text-center">
                        <BookOpen size={20} className="text-red-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-gray-900">{progress.vocabulary}</p>
                        <p className="text-xs text-gray-600">Words</p>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-3 text-center">
                        <TrendingUp size={20} className="text-orange-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-gray-900">{progress.fluencyScore}%</p>
                        <p className="text-xs text-gray-600">Fluency</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <MessageSquare size={20} className="text-blue-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-gray-900">{progress.conversations}</p>
                        <p className="text-xs text-gray-600">Sessions</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Groups */}
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Groups</p>
                  <div className="flex flex-wrap gap-2">
                    {getStudentGroups(selectedStudent.id).map((group) => (
                      <span key={group.id} className="inline-flex items-center bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full text-sm">
                        {group.name}
                        <button
                          onClick={() => handleRemoveFromGroup(selectedStudent.id, group.id)}
                          className="ml-1 hover:text-cyan-900"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {getStudentGroups(selectedStudent.id).length === 0 && (
                      <span className="text-sm text-gray-400">Not in any groups</span>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setObservationTarget({ type: 'student', id: selectedStudent.id });
                      setShowObservationForm(true);
                    }}
                    className="p-3 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-sm font-medium hover:bg-purple-100"
                  >
                    <FileText size={16} className="mr-2" />
                    Add Note
                  </button>
                  <button
                    onClick={() => handleUnassignStudent(selectedStudent.id)}
                    className="p-3 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-sm font-medium hover:bg-red-100"
                  >
                    <UserMinus size={16} className="mr-2" />
                    Unassign
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assign Student Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex-shrink-0 p-4 border-b flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Assign Students</h3>
                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {unassignedStudents.length > 0 ? (
                  <div className="space-y-2">
                    {unassignedStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User size={16} className="text-gray-600" />
                          </div>
                          <div className="ml-2">
                            <p className="font-medium text-gray-900 text-sm">
                              {student.display_name || student.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-gray-500">{student.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAssignStudent(student.id)}
                          disabled={loading}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No unassigned students available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Group Modal */}
        {showGroupModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex-shrink-0 p-4 border-b flex items-center justify-between">
                <h3 className="font-bold text-gray-900">
                  {editingGroup ? 'Edit Group' : 'Create Group'}
                </h3>
                <button onClick={() => setShowGroupModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4"
                  autoFocus
                />
                
                <p className="text-sm font-medium text-gray-700 mb-2">Select Students:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {students.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudentsForGroup.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentsForGroup(prev => [...prev, student.id]);
                          } else {
                            setSelectedStudentsForGroup(prev => prev.filter(id => id !== student.id));
                          }
                        }}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User size={14} className="text-blue-600" />
                        </div>
                        <span className="ml-2 text-sm">
                          {student.display_name || student.email?.split('@')[0]}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                  disabled={loading || !newGroupName.trim()}
                  className="w-full mt-4 py-2.5 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingGroup ? 'Update Group' : 'Create Group'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;