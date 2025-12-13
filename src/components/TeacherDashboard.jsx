/**
 * Teacher Dashboard Component - V12 FIXED
 * Mobile-First Design with Database-Backed Groups
 * FIXED: Changed from modal layout to panel layout (like AdminPanel)
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

  // Modal states - these are for ACTIONS only, not the main panel
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

  // Database helper functions
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
      studentIds: group.group_members?.map(m => m.student_id) || [],
      students: group.group_members?.map(m => m.student) || []
    }));
  };

  const createGroupInDB = async (teacherId, name, studentIds = []) => {
    const { data: group, error: groupError } = await supabase
      .from('teacher_groups')
      .insert([{ teacher_id: teacherId, name }])
      .select()
      .single();
    
    if (groupError) throw groupError;

    if (studentIds.length > 0) {
      const members = studentIds.map(studentId => ({
        group_id: group.id,
        student_id: studentId
      }));
      
      const { error: memberError } = await supabase
        .from('group_members')
        .insert(members);
      
      if (memberError) throw memberError;
    }
    
    return group;
  };

  const deleteGroupInDB = async (groupId) => {
    await supabase.from('group_members').delete().eq('group_id', groupId);
    const { error } = await supabase.from('teacher_groups').delete().eq('id', groupId);
    if (error) throw error;
  };

  const addStudentToGroupInDB = async (groupId, studentId) => {
    const { error } = await supabase
      .from('group_members')
      .insert([{ group_id: groupId, student_id: studentId }]);
    if (error) throw error;
  };

  const removeStudentFromGroupInDB = async (groupId, studentId) => {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('student_id', studentId);
    if (error) throw error;
  };

  const addObservationToDB = async (observations) => {
    const { data, error } = await supabase
      .from('observations')
      .insert(observations)
      .select();
    if (error) throw error;
    return data;
  };

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

  // Load data
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Get assigned students
      const { data: assignedStudents, error: studentsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('role', 'student');
      
      if (studentsError) throw studentsError;
      setStudents(assignedStudents || []);

      // Get unassigned students
      const { data: unassigned, error: unassignedError } = await supabase
        .from('profiles')
        .select('*')
        .is('teacher_id', null)
        .eq('role', 'student');
      
      if (unassignedError) throw unassignedError;
      setUnassignedStudents(unassigned || []);

      // Get study guides - getAllStudyGuides returns an object, not an array
      const guidesFromContext = getAllStudyGuides();
      // It's already a map/object keyed by user_id, so use it directly
      if (guidesFromContext && typeof guidesFromContext === 'object') {
        setStudyGuides(guidesFromContext);
      } else {
        setStudyGuides({});
      }
      
      // Also fetch study guides directly from database for assigned students
      if (assignedStudents && assignedStudents.length > 0) {
        const studentIds = assignedStudents.map(s => s.id);
        const { data: dbGuides, error: guidesError } = await supabase
          .from('study_guides')
          .select('*')
          .in('user_id', studentIds);
        
        if (!guidesError && dbGuides) {
          const guidesMap = { ...guidesFromContext };
          dbGuides.forEach(g => {
            if (g.user_id) guidesMap[g.user_id] = g;
          });
          setStudyGuides(guidesMap);
        }
      }

      // Get groups
      try {
        const teacherGroups = await getTeacherGroups(user.id);
        setGroups(teacherGroups);
      } catch (err) {
        console.log('Groups not available:', err.message);
        setGroups([]);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  }, [user?.id, getAllStudyGuides]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Student operations
  const handleAssignStudent = async (studentId) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ teacher_id: user.id })
        .eq('id', studentId);
      
      if (error) throw error;
      
      await loadData();
      setMessage({ type: 'success', text: 'Student assigned successfully' });
    } catch (err) {
      console.error('Error assigning student:', err);
      setMessage({ type: 'error', text: 'Failed to assign student' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignStudent = async (studentId) => {
    if (!confirm('Are you sure you want to unassign this student?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ teacher_id: null })
        .eq('id', studentId);
      
      if (error) throw error;
      
      setSelectedStudent(null);
      await loadData();
      setMessage({ type: 'success', text: 'Student unassigned' });
    } catch (err) {
      console.error('Error unassigning student:', err);
      setMessage({ type: 'error', text: 'Failed to unassign student' });
    } finally {
      setLoading(false);
    }
  };

  // Group operations
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a group name' });
      return;
    }

    setLoading(true);
    try {
      await createGroupInDB(user.id, newGroupName, selectedStudentsForGroup);
      const updatedGroups = await getTeacherGroups(user.id);
      setGroups(updatedGroups);
      setNewGroupName('');
      setSelectedStudentsForGroup([]);
      setShowGroupModal(false);
      setMessage({ type: 'success', text: 'Group created successfully' });
    } catch (err) {
      console.error('Error creating group:', err);
      setMessage({ type: 'error', text: 'Failed to create group' });
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

  // Observation operations
  const handleAddObservation = async () => {
    if (!newObservation.trim()) {
      setMessage({ type: 'error', text: 'Please enter an observation' });
      return;
    }

    setLoading(true);
    try {
      if (observationTarget.type === 'student' && observationTarget.id) {
        await addObservation(observationTarget.id, newObservation);
      } else if (observationTarget.type === 'group' && observationTarget.id) {
        const group = groups.find(g => g.id === observationTarget.id);
        if (group?.studentIds?.length > 0) {
          const observations = group.studentIds.map(studentId => ({
            student_id: studentId,
            teacher_id: user.id,
            text: newObservation
          }));
          await addObservationToDB(observations);
        }
      } else if (observationTarget.type === 'all') {
        const observations = students.map(student => ({
          student_id: student.id,
          teacher_id: user.id,
          text: newObservation
        }));
        await addObservationToDB(observations);
      }

      setNewObservation('');
      setObservationTarget({ type: 'student', id: null });
      setShowObservationForm(false);
      setMessage({ type: 'success', text: 'Observation added' });
    } catch (err) {
      console.error('Error adding observation:', err);
      setMessage({ type: 'error', text: 'Failed to add observation' });
    } finally {
      setLoading(false);
    }
  };

  // Material operations
  const handleAddMaterial = async () => {
    if (!newMaterial.title.trim() || !newMaterial.url.trim()) {
      setMessage({ type: 'error', text: 'Please fill in title and URL' });
      return;
    }

    setLoading(true);
    try {
      const description = newMaterial.description || '';
      
      if (newMaterial.targetType === 'all') {
        await addMaterialToDB(user.id, newMaterial.title, newMaterial.url, description, [], [], true);
      } else if (newMaterial.targetType === 'group') {
        await addMaterialToDB(user.id, newMaterial.title, newMaterial.url, description, newMaterial.targetIds, [], false);
      } else {
        await addMaterialToDB(user.id, newMaterial.title, newMaterial.url, description, [], newMaterial.targetIds, false);
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

  // Announcement operations
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

  const toggleGroupExpansion = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // ============================================
  // MAIN RENDER - Panel layout (NOT modal)
  // ============================================
  return (
    <div className="flex flex-col h-full">
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
              disabled={loading}
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

      {/* Message Banner */}
      {message.text && (
        <div className={`px-4 py-2 text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Content - Scrollable */}
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
              <h3 className="font-semibold text-gray-900">Student Groups ({groups.length})</h3>
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
              {groups.map((group) => (
                <div key={group.id} className="bg-white border rounded-xl overflow-hidden">
                  <div
                    onClick={() => toggleGroupExpansion(group.id)}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <Users2 size={20} className="text-cyan-600 mr-2" />
                      <div>
                        <p className="font-medium text-gray-900">{group.name}</p>
                        <p className="text-xs text-gray-500">{group.studentIds?.length || 0} students</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id);
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                      {expandedGroups[group.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                  
                  {expandedGroups[group.id] && (
                    <div className="border-t p-3 bg-gray-50">
                      {group.students?.length > 0 ? (
                        <div className="space-y-2">
                          {group.students.map((student) => (
                            <div key={student.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{student.display_name || student.email}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No students in this group</p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {groups.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users2 size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No groups created yet</p>
                  <button
                    onClick={() => setShowGroupModal(true)}
                    className="mt-3 text-cyan-600 text-sm hover:underline"
                  >
                    Create your first group
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Charts/Overview Tab */}
        {activeTab === 'charts' && (
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Class Overview</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{students.length}</p>
                <p className="text-xs text-gray-600">Total Students</p>
              </div>
              <div className="bg-cyan-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-cyan-600">{groups.length}</p>
                <p className="text-xs text-gray-600">Groups</p>
              </div>
            </div>
            {/* Add TeacherOverviewCharts component here if available */}
          </div>
        )}

        {/* Observations/Notes Tab */}
        {activeTab === 'observations' && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Observations</h3>
              <button
                onClick={() => setShowObservationForm(true)}
                className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
              >
                <Plus size={16} className="mr-1" />
                Add Note
              </button>
            </div>

            {/* Observation Form */}
            {showObservationForm && (
              <div className="mb-4 p-4 bg-purple-50 rounded-xl">
                <textarea
                  value={newObservation}
                  onChange={(e) => setNewObservation(e.target.value)}
                  placeholder="Write your observation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowObservationForm(false);
                      setNewObservation('');
                    }}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-900 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddObservation}
                    disabled={loading}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* List of students with observations */}
            <div className="space-y-3">
              {students.map((student) => {
                const guide = studyGuides[student.id];
                const observations = guide?.observations || [];
                return (
                  <div key={student.id} className="bg-white border rounded-xl p-3">
                    <p className="font-medium text-gray-900 mb-2">
                      {student.display_name || student.email?.split('@')[0]}
                    </p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                  rows={2}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowMaterialForm(false);
                      setNewMaterial({ title: '', url: '', description: '', targetType: 'all', targetIds: [] });
                    }}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-900 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMaterial}
                    disabled={loading}
                    className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            <div className="text-center py-8 text-gray-500">
              <LinkIcon size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Share learning resources with your students</p>
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
                New Post
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
                  placeholder="Write your announcement..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowAnnouncementForm(false);
                      setNewAnnouncement({ title: '', message: '', priority: 'normal', targetType: 'all', targetIds: [] });
                    }}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-900 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAnnouncement}
                    disabled={loading}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    Post
                  </button>
                </div>
              </div>
            )}

            <div className="text-center py-8 text-gray-500">
              <Bell size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Post important messages for your students</p>
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* MODALS - Only for specific actions */}
      {/* ============================================ */}

      {/* Selected Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 p-4 border-b flex items-center justify-between">
              <div className="flex items-center">
                <button onClick={() => setSelectedStudent(null)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>
                <h3 className="font-bold text-gray-900 ml-2">Student Details</h3>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User size={32} className="text-blue-600" />
                </div>
                <p className="font-bold text-lg text-gray-900">
                  {selectedStudent.display_name || selectedStudent.email?.split('@')[0]}
                </p>
                <p className="text-sm text-gray-500">{selectedStudent.email}</p>
              </div>

              {/* Progress */}
              {(() => {
                const progress = getStudentProgress(selectedStudent.id);
                return progress ? (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-red-50 rounded-xl p-2 text-center">
                      <p className="text-lg font-bold text-red-600">{progress.vocabulary}</p>
                      <p className="text-xs text-gray-600">Words</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-2 text-center">
                      <p className="text-lg font-bold text-blue-600">{progress.conversations}</p>
                      <p className="text-xs text-gray-600">Chats</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-2 text-center">
                      <p className="text-lg font-bold text-green-600">{progress.fluencyScore}%</p>
                      <p className="text-xs text-gray-600">Fluency</p>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setObservationTarget({ type: 'student', id: selectedStudent.id });
                    setShowObservationForm(true);
                    setSelectedStudent(null);
                    setActiveTab('observations');
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

      {/* Create Group Modal */}
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
              />
              
              <p className="text-sm font-medium text-gray-700 mb-2">Add Students (optional)</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {students.map((student) => (
                  <label key={student.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
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
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      {student.display_name || student.email?.split('@')[0]}
                    </span>
                  </label>
                ))}
              </div>
              
              <button
                onClick={handleCreateGroup}
                disabled={loading || !newGroupName.trim()}
                className="w-full mt-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;