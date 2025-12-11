/**
 * Teacher Dashboard Component - Mobile-First Design
 * With student assignment and group management
 * Fixed: Single assign button, proper refresh, groups show students with same modal
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudyGuide } from '../contexts/StudyGuideContext';
import {
  Users, User, BookOpen, Bell, FileText,
  ChevronRight, Plus, Trash2, Send, X, Link as LinkIcon,
  AlertTriangle, Globe, ChevronLeft, UserPlus, UserMinus,
  FolderPlus, Edit2, Check, Users2, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { supabase } from '../services/supabase';

export const TeacherDashboard = ({ onClose }) => {
  const { user, profile, getStudents, refreshUser } = useAuth();
  const { getAllStudyGuides, addObservation } = useStudyGuide();
  const [activeTab, setActiveTab] = useState('students');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [studyGuides, setStudyGuides] = useState({});
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Student assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // Group management
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

  const [newObservation, setNewObservation] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'normal',
    global: true
  });
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    url: '',
    description: '',
    studentIds: [],
    global: true
  });
  const [newImprovement, setNewImprovement] = useState({
    area: '',
    details: '',
    suggestions: ''
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStudents(),
        loadUnassignedStudents(),
        loadGroups()
      ]);
      
      const guides = getAllStudyGuides();
      setStudyGuides(guides || {});
    } catch (err) {
      console.error('Error loading data:', err);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('role', 'student')
        .order('display_name');

      if (error) throw error;
      setStudents(data || []);
      return data || [];
    } catch (err) {
      console.error('Error loading students:', err);
      return [];
    }
  };

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

  const loadGroups = async () => {
    try {
      const savedGroups = localStorage.getItem(`teacher_groups_${user.id}`);
      if (savedGroups) {
        setGroups(JSON.parse(savedGroups));
      }
    } catch (err) {
      console.error('Error loading groups:', err);
    }
  };

  const saveGroups = (newGroups) => {
    setGroups(newGroups);
    localStorage.setItem(`teacher_groups_${user.id}`, JSON.stringify(newGroups));
  };

  // Assign student to this teacher
  const handleAssignStudent = async (studentId) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ teacher_id: user.id })
        .eq('id', studentId);

      if (error) throw error;

      // Immediately update local state for responsive UI
      const assignedStudent = unassignedStudents.find(s => s.id === studentId);
      if (assignedStudent) {
        setStudents(prev => [...prev, { ...assignedStudent, teacher_id: user.id }]);
        setUnassignedStudents(prev => prev.filter(s => s.id !== studentId));
      }

      setMessage({ type: 'success', text: 'Student assigned successfully' });
    } catch (err) {
      console.error('Error assigning student:', err);
      setMessage({ type: 'error', text: 'Failed to assign student' });
      // Reload data on error to ensure consistency
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  // Unassign student from this teacher
  const handleUnassignStudent = async (studentId) => {
    if (!confirm('Are you sure you want to unassign this student? They will no longer appear in your dashboard.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ teacher_id: null })
        .eq('id', studentId);

      if (error) throw error;

      // Update local state immediately
      const unassignedStudent = students.find(s => s.id === studentId);
      if (unassignedStudent) {
        setUnassignedStudents(prev => [...prev, { ...unassignedStudent, teacher_id: null }]);
        setStudents(prev => prev.filter(s => s.id !== studentId));
      }

      // Also remove from any groups
      const updatedGroups = groups.map(group => ({
        ...group,
        studentIds: group.studentIds.filter(id => id !== studentId)
      }));
      saveGroups(updatedGroups);

      setMessage({ type: 'success', text: 'Student unassigned' });
      setSelectedStudent(null);
    } catch (err) {
      console.error('Error unassigning student:', err);
      setMessage({ type: 'error', text: 'Failed to unassign student' });
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  // Create a new group
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a group name' });
      return;
    }

    const newGroup = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      studentIds: selectedStudentsForGroup,
      createdAt: new Date().toISOString()
    };

    saveGroups([...groups, newGroup]);
    setNewGroupName('');
    setSelectedStudentsForGroup([]);
    setShowGroupModal(false);
    setMessage({ type: 'success', text: 'Group created successfully' });
  };

  // Update existing group
  const handleUpdateGroup = () => {
    if (!newGroupName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a group name' });
      return;
    }

    const updatedGroups = groups.map(group =>
      group.id === editingGroup.id
        ? { ...group, name: newGroupName.trim(), studentIds: selectedStudentsForGroup }
        : group
    );

    saveGroups(updatedGroups);
    setEditingGroup(null);
    setNewGroupName('');
    setSelectedStudentsForGroup([]);
    setShowGroupModal(false);
    setMessage({ type: 'success', text: 'Group updated successfully' });
  };

  // Delete group
  const handleDeleteGroup = (groupId) => {
    if (!confirm('Are you sure you want to delete this group? Students will not be unassigned.')) {
      return;
    }

    const updatedGroups = groups.filter(g => g.id !== groupId);
    saveGroups(updatedGroups);
    setMessage({ type: 'success', text: 'Group deleted' });
  };

  // Open edit group modal
  const handleEditGroup = (group, e) => {
    e.stopPropagation();
    setEditingGroup(group);
    setNewGroupName(group.name);
    setSelectedStudentsForGroup(group.studentIds);
    setShowGroupModal(true);
  };

  // Toggle student in group selection
  const toggleStudentInGroup = (studentId) => {
    setSelectedStudentsForGroup(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Add student to existing group
  const handleAddToGroup = async (studentId, groupId) => {
    const updatedGroups = groups.map(group =>
      group.id === groupId && !group.studentIds.includes(studentId)
        ? { ...group, studentIds: [...group.studentIds, studentId] }
        : group
    );
    saveGroups(updatedGroups);
    setMessage({ type: 'success', text: 'Student added to group' });
  };

  // Remove student from group
  const handleRemoveFromGroup = (studentId, groupId) => {
    const updatedGroups = groups.map(group =>
      group.id === groupId
        ? { ...group, studentIds: group.studentIds.filter(id => id !== studentId) }
        : group
    );
    saveGroups(updatedGroups);
    setMessage({ type: 'success', text: 'Student removed from group' });
  };

  // Toggle group expansion
  const toggleGroupExpansion = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Get student's groups
  const getStudentGroups = (studentId) => {
    return groups.filter(group => group.studentIds.includes(studentId));
  };

  // Get student by ID
  const getStudentById = (studentId) => {
    return students.find(s => s.id === studentId);
  };

  const handleAddObservation = () => {
    if (selectedStudent && newObservation.trim()) {
      addObservation(selectedStudent.id, newObservation);
      setNewObservation('');
      setShowObservationForm(false);
      loadData();
    }
  };

  const handleAddAnnouncement = () => {
    if (newAnnouncement.title.trim() && newAnnouncement.message.trim()) {
      const announcements = JSON.parse(localStorage.getItem('announcements') || '{}');
      if (!announcements[user.id]) {
        announcements[user.id] = [];
      }

      announcements[user.id].push({
        id: Date.now().toString(),
        ...newAnnouncement,
        createdAt: new Date().toISOString(),
        createdBy: user.name || profile?.display_name,
        read: false
      });

      localStorage.setItem('announcements', JSON.stringify(announcements));

      setNewAnnouncement({
        title: '',
        message: '',
        priority: 'normal',
        global: true
      });
      setShowAnnouncementForm(false);
      setMessage({ type: 'success', text: 'Announcement posted' });
    }
  };

  const handleAddMaterial = () => {
    if (newMaterial.title.trim() && newMaterial.url.trim()) {
      const materials = JSON.parse(localStorage.getItem('learningMaterials') || '{}');
      if (!materials[user.id]) {
        materials[user.id] = [];
      }

      materials[user.id].push({
        id: Date.now().toString(),
        ...newMaterial,
        createdAt: new Date().toISOString(),
        createdBy: user.name || profile?.display_name
      });

      localStorage.setItem('learningMaterials', JSON.stringify(materials));

      setNewMaterial({
        title: '',
        url: '',
        description: '',
        studentIds: [],
        global: true
      });
      setShowMaterialForm(false);
      setMessage({ type: 'success', text: 'Material added' });
    }
  };

  const handleAddImprovement = () => {
    if (selectedStudentForImprovement && newImprovement.area.trim()) {
      const improvements = JSON.parse(localStorage.getItem('areasToImprove') || '{}');
      if (!improvements[selectedStudentForImprovement.id]) {
        improvements[selectedStudentForImprovement.id] = [];
      }

      improvements[selectedStudentForImprovement.id].push({
        id: Date.now().toString(),
        ...newImprovement,
        createdAt: new Date().toISOString(),
        createdBy: user.name || profile?.display_name
      });

      localStorage.setItem('areasToImprove', JSON.stringify(improvements));

      setNewImprovement({
        area: '',
        details: '',
        suggestions: ''
      });
      setSelectedStudentForImprovement(null);
      setShowImprovementForm(false);
      setMessage({ type: 'success', text: 'Improvement area added' });
    }
  };

  const getStudentProgress = (studentId) => {
    const guide = studyGuides[studentId];
    if (!guide) return null;

    return {
      vocabulary: guide.progress?.vocabularyMastered || guide.vocabulary_mastered || 0,
      conversations: guide.conversationCount || guide.conversation_count || 0,
      fluencyScore: guide.progress?.fluencyScore || guide.fluency_score || 0
    };
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Tab configuration with icons
  const tabs = [
    { id: 'students', icon: Users, label: 'Students', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-600' },
    { id: 'groups', icon: Users2, label: 'Groups', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-600' },
    { id: 'observations', icon: FileText, label: 'Notes', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-600' },
    { id: 'areasToImprove', icon: AlertTriangle, label: 'Improve', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-600' },
    { id: 'materials', icon: LinkIcon, label: 'Materials', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-600' },
    { id: 'announcements', icon: Bell, label: 'Announce', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-600' }
  ];

  // Student Detail Modal Component (reused for both Students and Groups tabs)
  const StudentDetailModal = ({ student, onClose }) => {
    if (!student) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex-shrink-0 bg-white p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={24} className="text-blue-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-900 truncate">
                    {student.display_name || student.email?.split('@')[0]}
                  </h2>
                  <p className="text-sm text-gray-600 truncate">{student.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full ml-2"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Progress */}
            {getStudentProgress(student.id) && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-blue-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {getStudentProgress(student.id).vocabulary}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Words</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {getStudentProgress(student.id).conversations}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Chats</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {getStudentProgress(student.id).fluencyScore}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Score</div>
                </div>
              </div>
            )}

            {/* Groups */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Groups</h4>
              <div className="flex flex-wrap gap-2">
                {getStudentGroups(student.id).map(group => (
                  <span 
                    key={group.id}
                    className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm flex items-center"
                  >
                    {group.name}
                    <button
                      onClick={() => handleRemoveFromGroup(student.id, group.id)}
                      className="ml-2 hover:text-cyan-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                {getStudentGroups(student.id).length === 0 && (
                  <span className="text-sm text-gray-400">No groups</span>
                )}
                {groups.filter(g => !g.studentIds.includes(student.id)).length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddToGroup(student.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="px-3 py-1 border border-dashed border-gray-300 rounded-full text-sm text-gray-500"
                    defaultValue=""
                  >
                    <option value="" disabled>+ Add to group</option>
                    {groups.filter(g => !g.studentIds.includes(student.id)).map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setShowObservationForm(true)}
                className="p-3 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-sm font-medium hover:bg-purple-100"
              >
                <FileText size={16} className="mr-2" />
                Add Note
              </button>
              <button
                onClick={() => handleUnassignStudent(student.id)}
                className="p-3 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-sm font-medium hover:bg-red-100"
              >
                <UserMinus size={16} className="mr-2" />
                Unassign
              </button>
            </div>

            {/* Add Observation Form */}
            {showObservationForm && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
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
                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Recent Observations */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Notes</h4>
              <div className="space-y-2">
                {(studyGuides[student.id]?.observations || []).slice(-3).reverse().map((obs) => (
                  <div key={obs.id} className="bg-white border rounded-lg p-3">
                    <p className="text-sm text-gray-900">{obs.text}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(obs.timestamp || obs.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {!(studyGuides[student.id]?.observations?.length) && (
                  <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Users className="mr-2 text-blue-600" size={24} />
            <span className="hidden sm:inline">Teacher Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0"
              title="Close"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`p-3 flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <Check size={18} />
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex-shrink-0 flex border-b bg-white shadow-sm overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[60px] px-2 py-3 flex flex-col items-center justify-center transition-all border-b-2 ${
                isActive
                  ? `${tab.color} ${tab.border} ${tab.bg}`
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} className="mb-1 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium leading-tight">{tab.label}</span>
              {tab.id === 'students' && students.length > 0 && (
                <span className={`text-[9px] mt-0.5 ${isActive ? tab.color : 'text-gray-400'}`}>
                  ({students.length})
                </span>
              )}
              {tab.id === 'groups' && groups.length > 0 && (
                <span className={`text-[9px] mt-0.5 ${isActive ? tab.color : 'text-gray-400'}`}>
                  ({groups.length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="p-4">
            {/* Single Action Button */}
            <button
              onClick={() => setShowAssignModal(true)}
              className="w-full mb-4 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center font-medium"
            >
              <UserPlus size={18} className="mr-2" />
              Assign Students
              {unassignedStudents.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-500 rounded-full text-xs">
                  {unassignedStudents.length} available
                </span>
              )}
            </button>

            {/* Student List */}
            <div className="space-y-3">
              {students.map((student) => {
                const progress = getStudentProgress(student.id);
                const studentGroups = getStudentGroups(student.id);

                return (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className="border rounded-xl p-4 hover:shadow-lg transition-all bg-white cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User size={20} className="text-blue-600" />
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {student.display_name || student.email?.split('@')[0]}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">{student.email}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-400 flex-shrink-0 ml-2" />
                    </div>

                    {/* Groups */}
                    {studentGroups.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {studentGroups.map(group => (
                          <span 
                            key={group.id}
                            className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-xs"
                          >
                            {group.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Progress */}
                    {progress && (
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                        <div className="text-center bg-blue-50 rounded-lg py-2">
                          <div className="text-lg font-bold text-blue-600">{progress.vocabulary}</div>
                          <div className="text-xs text-gray-600">Words</div>
                        </div>
                        <div className="text-center bg-green-50 rounded-lg py-2">
                          <div className="text-lg font-bold text-green-600">{progress.conversations}</div>
                          <div className="text-xs text-gray-600">Chats</div>
                        </div>
                        <div className="text-center bg-purple-50 rounded-lg py-2">
                          <div className="text-lg font-bold text-purple-600">{progress.fluencyScore}</div>
                          <div className="text-xs text-gray-600">Score</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {students.length === 0 && !loading && (
                <div className="text-center py-16 text-gray-500">
                  <Users size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm mb-2">No students assigned yet</p>
                  <p className="text-xs text-gray-400">Click the button above to assign students</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="p-4">
            <button
              onClick={() => {
                setEditingGroup(null);
                setNewGroupName('');
                setSelectedStudentsForGroup([]);
                setShowGroupModal(true);
              }}
              className="w-full mb-4 px-4 py-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 flex items-center justify-center font-medium"
            >
              <FolderPlus size={18} className="mr-2" />
              Create New Group
            </button>

            <div className="space-y-3">
              {groups.map((group) => {
                const groupStudents = students.filter(s => group.studentIds.includes(s.id));
                const isExpanded = expandedGroups[group.id];

                return (
                  <div key={group.id} className="border rounded-xl bg-white overflow-hidden">
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleGroupExpansion(group.id)}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                          <Users2 size={20} className="text-cyan-600" />
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold text-gray-900">{group.name}</h3>
                          <p className="text-sm text-gray-500">
                            {groupStudents.length} student{groupStudents.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleEditGroup(group, e)}
                          className="p-2 hover:bg-cyan-100 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} className="text-cyan-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                        {isExpanded ? (
                          <ChevronUp size={20} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-4">
                        {groupStudents.length > 0 ? (
                          <div className="space-y-2">
                            {groupStudents.map(student => (
                              <div 
                                key={student.id}
                                onClick={() => setSelectedStudent(student)}
                                className="flex items-center justify-between bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-all"
                              >
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User size={16} className="text-blue-600" />
                                  </div>
                                  <span className="ml-2 text-sm font-medium">
                                    {student.display_name || student.email?.split('@')[0]}
                                  </span>
                                </div>
                                <ChevronRight size={16} className="text-gray-400" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No students in this group
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {groups.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <Users2 size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No groups created yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create groups to organize your students
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes/Observations Tab */}
        {activeTab === 'observations' && (
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">All Student Notes</h3>
            <div className="space-y-3">
              {students.map((student) => {
                const guide = studyGuides[student.id];
                const observations = guide?.observations || [];

                if (observations.length === 0) return null;

                return (
                  <div key={student.id} className="border rounded-xl p-4 bg-white">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <User size={16} className="mr-2 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{student.display_name || student.email}</span>
                    </h4>
                    <div className="space-y-2">
                      {observations.slice(-2).reverse().map((obs) => (
                        <div key={obs.id} className="bg-purple-50 rounded-lg p-3">
                          <p className="text-sm text-gray-900">{obs.text}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(obs.timestamp || obs.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {students.every(s => !(studyGuides[s.id]?.observations?.length)) && (
                <div className="text-center py-16 text-gray-500">
                  <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No notes yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Areas to Improve Tab */}
        {activeTab === 'areasToImprove' && (
          <div className="p-4">
            {!selectedStudentForImprovement ? (
              <>
                <h3 className="font-semibold text-gray-900 mb-4">Select a Student</h3>
                <div className="space-y-3">
                  {students.map((student) => {
                    const improvements = JSON.parse(localStorage.getItem('areasToImprove') || '{}')[student.id] || [];

                    return (
                      <div
                        key={student.id}
                        onClick={() => setSelectedStudentForImprovement(student)}
                        className="border rounded-xl p-4 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center min-w-0 flex-1">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User size={20} className="text-orange-600" />
                            </div>
                            <div className="ml-3 min-w-0 flex-1">
                              <h4 className="font-medium text-gray-900 truncate">
                                {student.display_name || student.email}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {improvements.length} area{improvements.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <ChevronRight size={20} className="text-gray-400 flex-shrink-0 ml-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div>
                <button
                  onClick={() => setSelectedStudentForImprovement(null)}
                  className="mb-4 text-orange-600 hover:text-orange-700 flex items-center text-sm font-medium"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Back to students
                </button>

                <div className="mb-6 p-4 bg-orange-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900">
                    {selectedStudentForImprovement.display_name || selectedStudentForImprovement.email}
                  </h4>
                </div>

                <button
                  onClick={() => setShowImprovementForm(true)}
                  className="w-full mb-4 px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 flex items-center justify-center font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Add Area to Improve
                </button>

                {showImprovementForm && (
                  <div className="mb-6 p-4 border rounded-xl bg-white">
                    <input
                      type="text"
                      value={newImprovement.area}
                      onChange={(e) => setNewImprovement({...newImprovement, area: e.target.value})}
                      placeholder="Area (e.g., 'Tone accuracy')"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
                    />
                    <textarea
                      value={newImprovement.details}
                      onChange={(e) => setNewImprovement({...newImprovement, details: e.target.value})}
                      placeholder="Details..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 resize-none text-sm"
                      rows={3}
                    />
                    <textarea
                      value={newImprovement.suggestions}
                      onChange={(e) => setNewImprovement({...newImprovement, suggestions: e.target.value})}
                      placeholder="Suggestions..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 resize-none text-sm"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setShowImprovementForm(false);
                          setNewImprovement({ area: '', details: '', suggestions: '' });
                        }}
                        className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-900 border rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddImprovement}
                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {(JSON.parse(localStorage.getItem('areasToImprove') || '{}')[selectedStudentForImprovement.id] || []).map((improvement) => (
                    <div key={improvement.id} className="border rounded-xl p-4 bg-orange-50">
                      <h5 className="font-semibold text-orange-900 flex items-center">
                        <AlertTriangle size={16} className="mr-2" />
                        {improvement.area}
                      </h5>
                      {improvement.details && (
                        <p className="text-sm text-gray-700 mt-2">{improvement.details}</p>
                      )}
                      {improvement.suggestions && (
                        <p className="text-sm text-gray-700 mt-2">
                          <strong>Suggestions:</strong> {improvement.suggestions}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(improvement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="p-4">
            <button
              onClick={() => setShowMaterialForm(true)}
              className="w-full mb-4 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center justify-center font-medium"
            >
              <Plus size={18} className="mr-2" />
              Add Learning Material
            </button>

            {showMaterialForm && (
              <div className="mb-6 p-4 border rounded-xl bg-white">
                <input
                  type="text"
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                  placeholder="Material Title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
                />
                <input
                  type="url"
                  value={newMaterial.url}
                  onChange={(e) => setNewMaterial({...newMaterial, url: e.target.value})}
                  placeholder="URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
                />
                <textarea
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                  placeholder="Description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 resize-none text-sm"
                  rows={2}
                />
                <label className="flex items-center mb-3 text-sm">
                  <input
                    type="checkbox"
                    checked={newMaterial.global}
                    onChange={(e) => setNewMaterial({...newMaterial, global: e.target.checked})}
                    className="mr-2"
                  />
                  <Globe size={14} className="mr-1" />
                  Available to all students
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowMaterialForm(false);
                      setNewMaterial({ title: '', url: '', description: '', studentIds: [], global: true });
                    }}
                    className="flex-1 px-4 py-2 text-gray-600 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMaterial}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {(JSON.parse(localStorage.getItem('learningMaterials') || '{}')[user.id] || []).map((material) => (
                <div key={material.id} className="border rounded-xl p-4 bg-white">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <LinkIcon size={16} className="mr-2 text-green-600" />
                    {material.title}
                  </h4>
                  <a href={material.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                    {material.url}
                  </a>
                  {material.description && (
                    <p className="text-sm text-gray-600 mt-2">{material.description}</p>
                  )}
                </div>
              ))}

              {!(JSON.parse(localStorage.getItem('learningMaterials') || '{}')[user.id]?.length) && (
                <div className="text-center py-16 text-gray-500">
                  <LinkIcon size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No materials yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="p-4">
            <button
              onClick={() => setShowAnnouncementForm(true)}
              className="w-full mb-4 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center justify-center font-medium"
            >
              <Plus size={18} className="mr-2" />
              Post Announcement
            </button>

            {showAnnouncementForm && (
              <div className="mb-6 p-4 border rounded-xl bg-white">
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  placeholder="Title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
                />
                <textarea
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                  placeholder="Message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 resize-none text-sm"
                  rows={4}
                />
                <select
                  value={newAnnouncement.priority}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowAnnouncementForm(false);
                      setNewAnnouncement({ title: '', message: '', priority: 'normal', global: true });
                    }}
                    className="flex-1 px-4 py-2 text-gray-600 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAnnouncement}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                  >
                    <Send size={14} className="mr-2" />
                    Post
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {(JSON.parse(localStorage.getItem('announcements') || '{}')[user.id] || []).map((announcement) => (
                <div key={announcement.id} className={`border rounded-xl p-4 ${
                  announcement.priority === 'urgent' ? 'bg-red-50' :
                  announcement.priority === 'important' ? 'bg-yellow-50' : 'bg-white'
                }`}>
                  <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                  <p className="text-sm text-gray-700 mt-2">{announcement.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}

              {!(JSON.parse(localStorage.getItem('announcements') || '{}')[user.id]?.length) && (
                <div className="text-center py-16 text-gray-500">
                  <Bell size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No announcements yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Student Detail Modal - Used by both Students tab and Groups tab */}
      {selectedStudent && (
        <StudentDetailModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}

      {/* Assign Students Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 bg-white p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <UserPlus size={24} className="mr-2 text-blue-600" />
                  Assign Students
                </h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {unassignedStudents.length} unassigned student{unassignedStudents.length !== 1 ? 's' : ''} available
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {unassignedStudents.length > 0 ? (
                <div className="space-y-2">
                  {unassignedStudents.map(student => (
                    <div 
                      key={student.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User size={20} className="text-gray-500" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">
                            {student.display_name || student.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignStudent(student.id)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No unassigned students available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 bg-white p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <Users2 size={24} className="mr-2 text-cyan-600" />
                  {editingGroup ? 'Edit Group' : 'Create Group'}
                </h2>
                <button
                  onClick={() => {
                    setShowGroupModal(false);
                    setEditingGroup(null);
                    setNewGroupName('');
                    setSelectedStudentsForGroup([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., Beginner Class, Monday Group"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Students ({selectedStudentsForGroup.length} selected)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                  {students.map(student => (
                    <label 
                      key={student.id}
                      className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedStudentsForGroup.includes(student.id) 
                          ? 'bg-cyan-50' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudentsForGroup.includes(student.id)}
                        onChange={() => toggleStudentInGroup(student.id)}
                        className="mr-3"
                      />
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-blue-600" />
                      </div>
                      <span className="ml-2 text-sm font-medium">
                        {student.display_name || student.email?.split('@')[0]}
                      </span>
                    </label>
                  ))}

                  {students.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No students assigned yet
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 p-4 border-t bg-gray-50">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowGroupModal(false);
                    setEditingGroup(null);
                    setNewGroupName('');
                    setSelectedStudentsForGroup([]);
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                  className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                >
                  {editingGroup ? 'Update Group' : 'Create Group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;