/**
 * Teacher Dashboard Component - V13
 * Mobile-First Design with Database-Backed Groups
 * UPDATES:
 * - Overview tab shows combined student charts + student list
 * - Click student name to see individual progress chart in modal
 * - Announcements section shows previous announcements
 * - Fixed materials add button freeze issue
 * - Improved chart display
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudyGuide } from '../contexts/StudyGuideContext';
import {
  Users, User, BookOpen, Bell, FileText, BarChart3, TrendingUp, MessageSquare,
  ChevronRight, Plus, Trash2, Send, X, Link as LinkIcon,
  AlertTriangle, Globe, ChevronLeft, UserPlus, UserMinus,
  FolderPlus, Edit2, Check, Users2, ChevronDown, ChevronUp, RefreshCw, Calendar
} from 'lucide-react';
import { supabase } from '../services/supabase';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';

// Color palette for charts
const CHART_COLORS = ['#ef4444', '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

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

  // Announcements data
  const [announcements, setAnnouncements] = useState([]);

  // Materials data
  const [materials, setMaterials] = useState([]);

  // Student chart modal
  const [showStudentChartModal, setShowStudentChartModal] = useState(false);
  const [selectedStudentForChart, setSelectedStudentForChart] = useState(null);

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

  // Form submission states (separate from global loading)
  const [submittingMaterial, setSubmittingMaterial] = useState(false);
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);

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
      students: group.group_members?.map(gm => gm.student).filter(Boolean) || [],
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
    return data;
  };

  const deleteGroupFromDB = async (groupId) => {
    const { error } = await supabase
      .from('teacher_groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
  };

  const addStudentToGroupInDB = async (groupId, studentId) => {
    const { error } = await supabase
      .from('group_members')
      .insert([{ group_id: groupId, student_id: studentId }]);

    if (error && error.code !== '23505') throw error;
  };

  const removeStudentFromGroupInDB = async (groupId, studentId) => {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('student_id', studentId);

    if (error) throw error;
  };

  const addMaterialToDB = async (teacherId, title, url, description, groupIds = [], studentIds = [], isGlobal = false) => {
    const { data, error } = await supabase
      .from('learning_materials')
      .insert([{
        teacher_id: teacherId,
        title,
        url,
        description,
        is_global: isGlobal,
        group_ids: groupIds,
        student_ids: studentIds
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
        is_global: isGlobal,
        group_ids: groupIds
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

      // Get study guides
      const guidesFromContext = getAllStudyGuides();
      if (guidesFromContext && typeof guidesFromContext === 'object') {
        setStudyGuides(guidesFromContext);
      } else {
        setStudyGuides({});
      }
      
      // Fetch study guides from database for assigned students
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

      // Get announcements
      try {
        const { data: announcementsData, error: announcementsError } = await supabase
          .from('announcements')
          .select('*')
          .eq('teacher_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!announcementsError) {
          setAnnouncements(announcementsData || []);
        }
      } catch (err) {
        console.log('Could not load announcements:', err);
      }

      // Get materials
      try {
        const { data: materialsData, error: materialsError } = await supabase
          .from('learning_materials')
          .select('*')
          .eq('teacher_id', user.id)
          .order('created_at', { ascending: false });

        if (!materialsError) {
          setMaterials(materialsData || []);
        }
      } catch (err) {
        console.log('Could not load materials:', err);
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
      const { data, error } = await supabase
        .from('profiles')
        .update({ teacher_id: user.id })
        .eq('id', studentId)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        if (error.code === '42501' || error.message?.includes('policy')) {
          throw new Error('Permission denied. Please ask an admin to assign this student.');
        }
        throw error;
      }
      
      const assignedStudent = unassignedStudents.find(s => s.id === studentId);
      if (assignedStudent) {
        setStudents(prev => [...prev, { ...assignedStudent, teacher_id: user.id }]);
        setUnassignedStudents(prev => prev.filter(s => s.id !== studentId));
      }
      
      setShowAssignModal(false);
      setMessage({ type: 'success', text: `${assignedStudent?.display_name || 'Student'} assigned successfully` });
      await loadData();
    } catch (err) {
      console.error('Error assigning student:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to assign student' });
      await loadData();
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
      const newGroup = await createGroupInDB(user.id, newGroupName.trim());
      
      for (const studentId of selectedStudentsForGroup) {
        await addStudentToGroupInDB(newGroup.id, studentId);
      }

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
      await deleteGroupFromDB(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setMessage({ type: 'success', text: 'Group deleted' });
    } catch (err) {
      console.error('Error deleting group:', err);
      setMessage({ type: 'error', text: 'Failed to delete group' });
    } finally {
      setLoading(false);
    }
  };

  // Material operations - FIXED
  const handleAddMaterial = async () => {
    if (!newMaterial.title.trim() || !newMaterial.url.trim()) {
      setMessage({ type: 'error', text: 'Please fill in title and URL' });
      return;
    }

    setSubmittingMaterial(true);
    try {
      const description = newMaterial.description || '';
      let newMat;
      
      if (newMaterial.targetType === 'all') {
        newMat = await addMaterialToDB(user.id, newMaterial.title, newMaterial.url, description, [], [], true);
      } else if (newMaterial.targetType === 'group') {
        newMat = await addMaterialToDB(user.id, newMaterial.title, newMaterial.url, description, newMaterial.targetIds, [], false);
      } else {
        newMat = await addMaterialToDB(user.id, newMaterial.title, newMaterial.url, description, [], newMaterial.targetIds, false);
      }

      // Add to local state
      if (newMat) {
        setMaterials(prev => [newMat, ...prev]);
      }

      // Reset form
      setNewMaterial({ title: '', url: '', description: '', targetType: 'all', targetIds: [] });
      setShowMaterialForm(false);
      setMessage({ type: 'success', text: 'Material added successfully' });
    } catch (err) {
      console.error('Error adding material:', err);
      setMessage({ type: 'error', text: 'Failed to add material' });
    } finally {
      setSubmittingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!confirm('Delete this material?')) return;

    try {
      const { error } = await supabase
        .from('learning_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      setMaterials(prev => prev.filter(m => m.id !== materialId));
      setMessage({ type: 'success', text: 'Material deleted' });
    } catch (err) {
      console.error('Error deleting material:', err);
      setMessage({ type: 'error', text: 'Failed to delete material' });
    }
  };

  // Announcement operations - FIXED
  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      setMessage({ type: 'error', text: 'Please fill in title and message' });
      return;
    }

    setSubmittingAnnouncement(true);
    try {
      let newAnn;
      if (newAnnouncement.targetType === 'all') {
        newAnn = await addAnnouncementToDB(user.id, newAnnouncement.title, newAnnouncement.message, newAnnouncement.priority, [], true);
      } else if (newAnnouncement.targetType === 'group') {
        newAnn = await addAnnouncementToDB(user.id, newAnnouncement.title, newAnnouncement.message, newAnnouncement.priority, newAnnouncement.targetIds, false);
      }

      // Add to local state
      if (newAnn) {
        setAnnouncements(prev => [newAnn, ...prev]);
      }

      // Reset form
      setNewAnnouncement({ title: '', message: '', priority: 'normal', targetType: 'all', targetIds: [] });
      setShowAnnouncementForm(false);
      setMessage({ type: 'success', text: 'Announcement posted' });
    } catch (err) {
      console.error('Error adding announcement:', err);
      setMessage({ type: 'error', text: 'Failed to post announcement' });
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!confirm('Delete this announcement?')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;

      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
      setMessage({ type: 'success', text: 'Announcement deleted' });
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setMessage({ type: 'error', text: 'Failed to delete announcement' });
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

  // Calculate aggregate stats for charts
  const getAggregateStats = () => {
    const totalStudents = students.length;
    const guidesArray = students.map(s => studyGuides[s.id]).filter(Boolean);
    
    const activeStudents = guidesArray.filter(g => (g.conversation_count || 0) > 0).length;
    const averageVocabulary = guidesArray.length > 0 
      ? Math.round(guidesArray.reduce((sum, g) => sum + (g.vocabulary_mastered || 0), 0) / guidesArray.length)
      : 0;
    const averageFluency = guidesArray.length > 0
      ? Math.round(guidesArray.reduce((sum, g) => sum + (g.fluency_score || 0), 0) / guidesArray.length)
      : 0;
    const totalConversations = guidesArray.reduce((sum, g) => sum + (g.conversation_count || 0), 0);

    return { totalStudents, activeStudents, averageVocabulary, averageFluency, totalConversations };
  };

  // Prepare chart data
  const getStudentComparisonData = () => {
    return students.map(student => {
      const guide = studyGuides[student.id] || {};
      return {
        id: student.id,
        name: student.display_name || student.email?.split('@')[0] || 'Unknown',
        vocabulary: guide.vocabulary_mastered || 0,
        fluency: guide.fluency_score || 0,
        conversations: guide.conversation_count || 0
      };
    }).sort((a, b) => b.vocabulary - a.vocabulary);
  };

  // Get individual student chart data
  const getIndividualStudentData = (studentId) => {
    const guide = studyGuides[studentId];
    if (!guide) return null;

    return {
      vocabulary: guide.vocabulary_mastered || 0,
      fluency: guide.fluency_score || 0,
      conversations: guide.conversation_count || 0,
      strengths: guide.strengths || [],
      weaknesses: guide.weaknesses || [],
      goals: guide.goals || []
    };
  };

  const aggregateStats = getAggregateStats();
  const studentComparisonData = getStudentComparisonData();

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
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">My Students ({students.length})</h3>
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                <UserPlus size={16} className="mr-1" />
                Assign
              </button>
            </div>

            {students.length > 0 ? (
              <div className="space-y-3">
                {students.map((student) => {
                  const progress = getStudentProgress(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={20} className="text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <h4 className="font-medium text-gray-900">
                              {student.display_name || student.email?.split('@')[0]}
                            </h4>
                            <p className="text-xs text-gray-500">{student.email}</p>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                      </div>
                      {progress && (
                        <div className="mt-3 flex space-x-4 text-xs text-gray-600">
                          <span className="flex items-center">
                            <BookOpen size={12} className="mr-1" />
                            {progress.vocabulary} words
                          </span>
                          <span className="flex items-center">
                            <TrendingUp size={12} className="mr-1" />
                            {progress.fluencyScore}% fluency
                          </span>
                          <span className="flex items-center">
                            <MessageSquare size={12} className="mr-1" />
                            {progress.conversations} chats
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No students assigned yet</p>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="mt-3 text-blue-600 text-sm hover:underline"
                >
                  Assign your first student
                </button>
              </div>
            )}
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Student Groups ({groups.length})</h3>
              <button
                onClick={() => setShowGroupModal(true)}
                className="flex items-center px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700"
              >
                <FolderPlus size={16} className="mr-1" />
                Create Group
              </button>
            </div>

            <div className="space-y-3">
              {groups.map((group) => (
                <div key={group.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div
                    onClick={() => toggleGroupExpansion(group.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <Users2 size={20} className="text-cyan-600 mr-2" />
                      <div>
                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                        <p className="text-xs text-gray-500">{group.students?.length || 0} students</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
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

        {/* Charts/Overview Tab - IMPROVED */}
        {activeTab === 'charts' && (
          <div className="p-4 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <Users size={24} className="text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{aggregateStats.totalStudents}</p>
                <p className="text-xs text-gray-600">Total Students</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <TrendingUp size={24} className="text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{aggregateStats.activeStudents}</p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <BookOpen size={24} className="text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{aggregateStats.averageVocabulary}</p>
                <p className="text-xs text-gray-600">Avg. Vocab</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <BarChart3 size={24} className="text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{aggregateStats.averageFluency}%</p>
                <p className="text-xs text-gray-600">Avg. Fluency</p>
              </div>
            </div>

            {/* Combined Student Chart */}
            {students.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Student Comparison</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={studentComparisonData.slice(0, 10)} layout="vertical" margin={{ left: 80, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={75} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="vocabulary" fill="#ef4444" name="Vocabulary" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="fluency" fill="#f97316" name="Fluency %" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Student List - Click to see individual chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Student Progress Details</h3>
              <p className="text-sm text-gray-500 mb-3">Click a student to view their detailed progress chart</p>
              
              {students.length > 0 ? (
                <div className="space-y-2">
                  {students.map((student) => {
                    const progress = getStudentProgress(student.id);
                    return (
                      <div
                        key={student.id}
                        onClick={() => {
                          setSelectedStudentForChart(student);
                          setShowStudentChartModal(true);
                        }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <User size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {student.display_name || student.email?.split('@')[0]}
                            </p>
                            {progress && (
                              <p className="text-xs text-gray-500">
                                {progress.vocabulary} words • {progress.fluencyScore}% fluency
                              </p>
                            )}
                          </div>
                        </div>
                        <BarChart3 size={18} className="text-gray-400" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No students assigned yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Observations Tab */}
        {activeTab === 'observations' && (
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Teacher Notes</h3>
            
            {students.map((student) => {
              const observations = []; // Would load from database
              return (
                <div key={student.id} className="mb-4 p-4 bg-white rounded-xl border">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {student.display_name || student.email?.split('@')[0]}
                  </h4>
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
        )}

        {/* Materials Tab - FIXED */}
        {activeTab === 'materials' && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Learning Materials ({materials.length})</h3>
              <button
                onClick={() => setShowMaterialForm(true)}
                disabled={showMaterialForm}
                className="flex items-center px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50"
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
                    disabled={submittingMaterial}
                    className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50"
                  >
                    {submittingMaterial ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            )}

            {/* Materials List */}
            {materials.length > 0 ? (
              <div className="space-y-3">
                {materials.map((material) => (
                  <div key={material.id} className="bg-white rounded-xl border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{material.title}</h4>
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-teal-600 hover:underline flex items-center mt-1"
                        >
                          <LinkIcon size={12} className="mr-1" />
                          {material.url}
                        </a>
                        {material.description && (
                          <p className="text-sm text-gray-600 mt-2">{material.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Added {new Date(material.created_at).toLocaleDateString()}
                          {material.is_global && <span className="ml-2 text-green-600">• Global</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <LinkIcon size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Share learning resources with your students</p>
              </div>
            )}
          </div>
        )}

        {/* Announcements Tab - SHOWS PREVIOUS ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Announcements ({announcements.length})</h3>
              <button
                onClick={() => setShowAnnouncementForm(true)}
                disabled={showAnnouncementForm}
                className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
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
                <div className="flex items-center justify-between">
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, priority: e.target.value }))}
                    className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <div className="flex space-x-2">
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
                      disabled={submittingAnnouncement}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      {submittingAnnouncement ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Previous Announcements List */}
            {announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="bg-white rounded-xl border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                          {announcement.priority === 'urgent' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Urgent</span>
                          )}
                          {announcement.priority === 'important' && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">Important</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{announcement.message}</p>
                        <div className="flex items-center mt-2 text-xs text-gray-400">
                          <Calendar size={12} className="mr-1" />
                          {new Date(announcement.created_at).toLocaleDateString()}
                          {announcement.is_global && <span className="ml-2 text-green-600">• All Students</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bell size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No announcements yet</p>
              </div>
            )}
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
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {/* Student stats */}
              {getStudentProgress(selectedStudent.id) && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-gray-900">
                      {getStudentProgress(selectedStudent.id).vocabulary}
                    </p>
                    <p className="text-xs text-gray-600">Words</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-gray-900">
                      {getStudentProgress(selectedStudent.id).fluencyScore}%
                    </p>
                    <p className="text-xs text-gray-600">Fluency</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-gray-900">
                      {getStudentProgress(selectedStudent.id).conversations}
                    </p>
                    <p className="text-xs text-gray-600">Sessions</p>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => handleUnassignStudent(selectedStudent.id)}
                className="w-full py-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
              >
                <UserMinus size={16} className="inline mr-2" />
                Unassign Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Student Chart Modal */}
      {showStudentChartModal && selectedStudentForChart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 bg-gradient-to-r from-green-50 to-blue-50 p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 size={24} className="text-green-600 mr-2" />
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {selectedStudentForChart.display_name || selectedStudentForChart.email?.split('@')[0]}
                    </h2>
                    <p className="text-sm text-gray-600">Progress Details</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowStudentChartModal(false);
                    setSelectedStudentForChart(null);
                  }}
                  className="p-2 hover:bg-white/50 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const data = getIndividualStudentData(selectedStudentForChart.id);
                if (!data) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 size={48} className="mx-auto mb-3 text-gray-300" />
                      <p>No progress data available yet</p>
                    </div>
                  );
                }

                const chartData = [
                  { name: 'Vocabulary', value: data.vocabulary, fill: '#ef4444' },
                  { name: 'Fluency', value: data.fluency, fill: '#f97316' },
                  { name: 'Sessions', value: data.conversations, fill: '#3b82f6' }
                ];

                return (
                  <div className="space-y-4">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-red-50 rounded-xl p-3 text-center">
                        <BookOpen size={20} className="text-red-600 mx-auto mb-1" />
                        <p className="text-xl font-bold text-gray-900">{data.vocabulary}</p>
                        <p className="text-xs text-gray-600">Words</p>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-3 text-center">
                        <TrendingUp size={20} className="text-orange-600 mx-auto mb-1" />
                        <p className="text-xl font-bold text-gray-900">{data.fluency}%</p>
                        <p className="text-xs text-gray-600">Fluency</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <MessageSquare size={20} className="text-blue-600 mx-auto mb-1" />
                        <p className="text-xl font-bold text-gray-900">{data.conversations}</p>
                        <p className="text-xs text-gray-600">Sessions</p>
                      </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Performance Overview</h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    {(data.strengths?.length > 0 || data.weaknesses?.length > 0) && (
                      <div className="grid grid-cols-2 gap-3">
                        {data.strengths?.length > 0 && (
                          <div className="bg-green-50 rounded-xl p-3">
                            <h5 className="font-medium text-green-800 text-sm mb-2">Strengths</h5>
                            <ul className="text-xs text-green-700 space-y-1">
                              {data.strengths.slice(0, 3).map((s, i) => (
                                <li key={i}>• {s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {data.weaknesses?.length > 0 && (
                          <div className="bg-orange-50 rounded-xl p-3">
                            <h5 className="font-medium text-orange-800 text-sm mb-2">Areas to Improve</h5>
                            <ul className="text-xs text-orange-700 space-y-1">
                              {data.weaknesses.slice(0, 3).map((w, i) => (
                                <li key={i}>• {w}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Assign Student Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Assign Student</h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {unassignedStudents.length > 0 ? (
                <div className="space-y-2">
                  {unassignedStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleAssignStudent(student.id)}
                      disabled={loading}
                      className="w-full p-3 flex items-center justify-between bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User size={20} className="text-gray-600" />
                        </div>
                        <div className="ml-3 text-left">
                          <p className="font-medium text-gray-900">
                            {student.display_name || student.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      <UserPlus size={18} className="text-blue-600" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No unassigned students available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Create Group</h2>
                <button
                  onClick={() => {
                    setShowGroupModal(false);
                    setNewGroupName('');
                    setSelectedStudentsForGroup([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4"
              />
              
              <p className="text-sm text-gray-600 mb-2">Select students (optional):</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {students.map((student) => (
                  <label
                    key={student.id}
                    className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
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
                    <span className="text-sm text-gray-700">
                      {student.display_name || student.email?.split('@')[0]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0 p-4 border-t">
              <button
                onClick={handleCreateGroup}
                disabled={loading || !newGroupName.trim()}
                className="w-full py-3 bg-cyan-600 text-white rounded-xl font-medium hover:bg-cyan-700 disabled:opacity-50"
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